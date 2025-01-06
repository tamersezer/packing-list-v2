import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productService, packingListService } from '../../services/api';
import type { Product } from '../../types/Product';
import { toast } from 'react-toastify';
import type { PackingList } from '../../types/PackingList';
import { EditPackageModal } from './EditPackageModal';

type PackageType = 'pallet' | 'carton';

interface PackageRange {
  start: number;
  end: number;
}

interface PackageItem {
  product: Product;
  quantity: number;
  boxNo: string;
  mergeRows?: number;
}

interface PackageTotals {
  grossWeight: number;
  netWeight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
}

interface PackageRow {
  id: string;
  packageNo: string; // "1" veya "1 to 3" gibi
  items: {
    product: Product;
    quantity: number;
  }[];
  grossWeight: number;
  netWeight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  hsCode?: string; // Opsiyonel, eğer tüm ürünlerin HS kodu aynıysa kullanılacak
}

export const PackingListForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [packingList, setPackingList] = useState<PackingList>({
    invoiceNo: '',
    date: new Date().toISOString().split('T')[0],
    items: []
  });

  const [packageType, setPackageType] = useState<PackageType>('pallet');
  const [packageRange, setPackageRange] = useState<PackageRange>({ start: 1, end: 1 });
  const [products, setProducts] = useState<Product[]>([]);
  const [packageItems, setPackageItems] = useState<PackageItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totals, setTotals] = useState<PackageTotals>({
    grossWeight: 0,
    netWeight: 0,
    dimensions: {
      length: packageType === 'pallet' ? 80 : 0,
      width: packageType === 'pallet' ? 120 : 0,
      height: 0
    }
  });
  const [packageRows, setPackageRows] = useState<PackageRow[]>([]);
  const [editingPackage, setEditingPackage] = useState<PackageRow | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await productService.getAll();
        setProducts(data);
      } catch (error) {
        toast.error('Failed to load products');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleRangeChange = (field: keyof PackageRange, value: string) => {
    const numValue = parseInt(value) || 1;
    setPackageRange(prev => ({
      ...prev,
      [field]: numValue
    }));
  };

  const calculateWeights = (product: Product, quantity: number): { gross: number; net: number } => {
    return {
      gross: Number((product.weights.gross * quantity).toFixed(1)),
      net: Number((product.weights.net * quantity).toFixed(1))
    };
  };

  const handleAddProduct = (product: Product) => {
    const { gross, net } = calculateWeights(product, product.boxQuantity);
    setPackageItems(prev => [...prev, {
      product,
      quantity: product.boxQuantity,
      boxNo: product.boxNo
    }]);
  };

  const handleQuantityChange = (index: number, value: string) => {
    const numValue = parseInt(value) || 1;
    setPackageItems(prev => prev.map((item, i) => {
      if (i === index) {
        return {
          ...item,
          quantity: numValue
        };
      }
      return item;
    }));
  };

  const handleRemoveProduct = (index: number) => {
    setPackageItems(prev => prev.filter((_, i) => i !== index));
  };

  const calculateTotals = (items: PackageItem[]) => {
    const itemTotals = items.reduce(
      (acc, item) => ({
        gross: acc.gross + item.totalGrossWeight,
        net: acc.net + item.totalNetWeight
      }),
      { gross: 0, net: 0 }
    );

    const grossWeight = packageType === 'pallet' 
      ? itemTotals.gross + 24 
      : itemTotals.gross;

    return {
      grossWeight: Number(grossWeight.toFixed(1)),
      netWeight: Number(itemTotals.net.toFixed(1))
    };
  };

  useEffect(() => {
    const { grossWeight, netWeight } = calculateTotals(packageItems);
    setTotals(prev => ({
      ...prev,
      grossWeight,
      netWeight
    }));
  }, [packageItems, packageType, calculateTotals]);

  useEffect(() => {
    if (packageType === 'pallet') {
      setTotals(prev => ({
        ...prev,
        dimensions: {
          length: 80,
          width: 120,
          height: 0
        }
      }));
    } else if (packageItems.length > 0) {
      const firstProduct = packageItems[0].product;
      setTotals(prev => ({
        ...prev,
        dimensions: {
          length: firstProduct.boxDimensions.length,
          width: firstProduct.boxDimensions.width,
          height: firstProduct.boxDimensions.height
        }
      }));
    }
  }, [packageType, packageItems]);

  const handleTotalChange = (
    field: keyof PackageTotals | keyof PackageTotals['dimensions'],
    value: string
  ) => {
    const numValue = parseFloat(value) || 0;
    if (field === 'grossWeight' || field === 'netWeight') {
      setTotals(prev => ({
        ...prev,
        [field]: Number(numValue.toFixed(1))
      }));
    } else {
      setTotals(prev => ({
        ...prev,
        dimensions: {
          ...prev.dimensions,
          [field]: Number(numValue.toFixed(1))
        }
      }));
    }
  };

  const validatePackage = useCallback(() => {
    if (packageItems.length === 0) {
      toast.error('Please add at least one product');
      return false;
    }

    const { grossWeight, netWeight } = totals;
    if (grossWeight < netWeight) {
      toast.error('Gross weight cannot be less than net weight');
      return false;
    }

    if (totals.dimensions.height <= 0 || 
        totals.dimensions.width <= 0 || 
        totals.dimensions.length <= 0) {
      toast.error('All dimensions must be greater than 0');
      return false;
    }

    return true;
  }, [packageItems, totals]);

  const handleAddPackage = async () => {
    if (!validatePackage()) return;

    try {
      const packageNo = packageType === 'pallet' 
        ? packageRange.start.toString()
        : `${packageRange.start} to ${packageRange.end}`;

      // Yeni paket satırı oluştur
      const newPackageRow: PackageRow = {
        id: crypto.randomUUID(),
        packageNo,
        items: packageItems.map(item => ({
          product: item.product,
          quantity: item.quantity
        })),
        grossWeight: totals.grossWeight,
        netWeight: totals.netWeight,
        dimensions: totals.dimensions,
        // Eğer tüm ürünlerin HS kodu aynıysa, onu kullan
        hsCode: packageItems.every(item => item.product.hsCode === packageItems[0].product.hsCode)
          ? packageItems[0].product.hsCode
          : undefined
      };

      setPackageRows(prev => [...prev, newPackageRow]);

      // Formu sıfırla
      setPackageItems([]);
      setTotals({
        grossWeight: 0,
        netWeight: 0,
        dimensions: {
          length: packageType === 'pallet' ? 80 : 0,
          width: packageType === 'pallet' ? 120 : 0,
          height: 0
        }
      });

      // Palet ise sonraki numaraya geç
      if (packageType === 'pallet') {
        setPackageRange(prev => ({
          start: prev.start + 1,
          end: prev.start + 1
        }));
      } else {
        // Koli ise sonraki aralığa geç
        setPackageRange(prev => ({
          start: prev.end + 1,
          end: prev.end + 1
        }));
      }

      toast.success('Package added successfully');
    } catch (error) {
      toast.error('Failed to add package');
      console.error('Add package error:', error);
    }
  };

  // Son paket numarasını bulup bir sonrakini ayarla
  const setNextPackageNumber = (rows: PackageRow[]) => {
    if (rows.length === 0) {
      setPackageRange({ start: 1, end: 1 });
      return;
    }

    // Son paketin numarasını al
    const lastPackageNo = rows[rows.length - 1].packageNo;
    
    // "1 to 3" formatındaysa son sayıyı, değilse tek sayıyı al
    const match = lastPackageNo.match(/(\d+)(?:\s*to\s*(\d+))?/);
    if (!match) return;

    const lastNumber = match[2] || match[1];
    const nextNumber = parseInt(lastNumber) + 1;

    setPackageRange({
      start: nextNumber,
      end: nextNumber
    });
  };

  // Mevcut paket listesini yükle
  useEffect(() => {
    if (isEditing) {
      const loadPackingList = async () => {
        if (id) {
          try {
            const data = await packingListService.getById(id);
            setPackingList(data);
            setPackageRows(data.items);
          } catch (error) {
            toast.error('Failed to load packing list');
            navigate('/packing-list');
          }
        }
      };
      loadPackingList();
    }
  }, [id, navigate, isEditing]);

  // Package Type değiştiğinde input'u enable/disable yap
  useEffect(() => {
    const input = document.querySelector('input[type="number"][min="1"]') as HTMLInputElement;
    if (input) {
      input.disabled = packageType === 'pallet';
    }
  }, [packageType]);

  // Değişiklikleri otomatik kaydet
  useEffect(() => {
    if (!packingList.name) return;

    const timeoutId = setTimeout(async () => {
      try {
        const updatedPackingList = {
          ...packingList,
          items: packageRows,
          updatedAt: new Date().toISOString(),
          totalGrossWeight: packageRows.reduce((sum, row) => sum + row.grossWeight, 0),
          totalNetWeight: packageRows.reduce((sum, row) => sum + row.netWeight, 0),
          totalNumberOfBoxes: packageRows.reduce((sum, row) => 
            sum + row.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
          )
        };

        if (id) {
          await packingListService.update(id, updatedPackingList);
        } else if (packingList.id) {
          await packingListService.update(packingList.id, updatedPackingList);
        } else {
          const newList = await packingListService.create(updatedPackingList);
          setPackingList(prev => ({ ...prev, id: newList.id }));
        }
      } catch (error) {
        toast.error('Failed to save changes');
        console.error('Save error:', error);
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [packingList, packageRows, id]);

  // Sayfadan çıkmadan önce kontrol
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!packingList.name && (packageRows.length > 0 || packageItems.length > 0)) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [packingList.name, packageRows.length, packageItems.length]);

  const handleEditPackage = (packageRow: PackageRow) => {
    setEditingPackage(packageRow);
  };

  const handleSavePackage = (updatedPackage: PackageRow) => {
    setPackageRows(prev => prev.map(row => 
      row.id === updatedPackage.id ? updatedPackage : row
    ));
    setEditingPackage(null);
  };

  const handleBackToList = () => {
    if (!packingList.name && (packageRows.length > 0 || packageItems.length > 0)) {
      if (window.confirm('The packing list will not be saved without a name. Are you sure you want to exit?')) {
        navigate('/packing-list');
      }
    } else {
      navigate('/packing-list');
    }
  };

  const handleSubmit = async () => {
    try {
      const newPackingList: PackingList = {
        ...packingList,
        items: packageItems.map(item => ({
          boxNo: item.boxNo,
          product: item.product,
          quantity: item.quantity,
          mergeRows: item.mergeRows
        }))
      };

      if (id) {
        await packingListService.update(id, newPackingList);
      } else {
        await packingListService.create(newPackingList);
      }

      toast.success('Packing list saved successfully');
      navigate('/packing-list');
    } catch (error) {
      toast.error('Failed to save packing list');
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading packing list...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            value={packingList.name}
            onChange={(e) => setPackingList(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Enter Packing List Name"
            className="w-full px-4 py-2 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {packingList.status.charAt(0).toUpperCase() + packingList.status.slice(1)}
          </span>
          <button
            onClick={handleBackToList}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Back to List
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        <div className="flex-1">
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <div className="space-y-6">
              {/* Package Type Switch */}
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Package Type:</span>
                <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
                  <button
                    onClick={() => setPackageType('pallet')}
                    className={`
                      px-4 py-2 text-sm font-medium rounded-md
                      ${packageType === 'pallet'
                        ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                      }
                    `}
                  >
                    Pallet
                  </button>
                  <button
                    onClick={() => setPackageType('carton')}
                    className={`
                      px-4 py-2 text-sm font-medium rounded-md
                      ${packageType === 'carton'
                        ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                      }
                    `}
                  >
                    Carton
                  </button>
                </div>
              </div>

              {/* Package Number Range */}
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Package No:</span>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="1"
                    value={packageRange.start}
                    onChange={(e) => handleRangeChange('start', e.target.value)}
                    className="w-20 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white"
                    disabled={packageType === 'pallet'}
                  />
                  {packageType === 'carton' && (
                    <>
                      <span className="text-gray-500 dark:text-gray-400">to</span>
                      <input
                        type="number"
                        min={packageRange.start}
                        value={packageRange.end}
                        onChange={(e) => handleRangeChange('end', e.target.value)}
                        className="w-20 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </>
                  )}
                </div>
              </div>

              {/* Product List */}
              <div className="space-y-4">
                {packageItems.map((item, index) => (
                  <div key={index} className="flex items-center space-x-4 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">{item.product.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Weight: {item.totalGrossWeight} kg gross / {item.totalNetWeight} kg net
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(index, e.target.value)}
                        className="w-24 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      <button
                        onClick={() => handleRemoveProduct(index)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}

                {/* Add Product Button */}
                <div className="relative">
                  <button
                    type="button"
                    className="w-full px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md focus:outline-none"
                    onClick={() => {
                      const menu = document.getElementById('productMenu');
                      if (menu) menu.classList.toggle('hidden');
                    }}
                  >
                    + Add Product
                  </button>

                  {/* Product Dropdown Menu */}
                  <div
                    id="productMenu"
                    className="hidden absolute z-10 mt-2 w-full bg-white dark:bg-gray-800 shadow-lg rounded-md py-1 max-h-60 overflow-auto"
                  >
                    {products
                      .filter(product => !packageItems.some(item => item.product.id === product.id))
                      .map(product => (
                        <button
                          key={product.id}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => {
                            handleAddProduct(product);
                            const menu = document.getElementById('productMenu');
                            if (menu) menu.classList.add('hidden');
                          }}
                        >
                          <div className="font-medium">{product.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            HS Code: {product.hsCode} | Box Qty: {product.boxQuantity}
                          </div>
                        </button>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sağ taraf - Totals */}
        <div className="w-80 bg-white dark:bg-gray-800 shadow rounded-lg p-6 h-fit sticky top-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Package Totals</h3>
          
          <div className="space-y-4">
            {/* Weights */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Total Gross Weight (kg)
              </label>
              <input
                type="number"
                step="0.1"
                value={totals.grossWeight}
                onChange={(e) => handleTotalChange('grossWeight', e.target.value)}
                className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Total Net Weight (kg)
              </label>
              <input
                type="number"
                step="0.1"
                value={totals.netWeight}
                onChange={(e) => handleTotalChange('netWeight', e.target.value)}
                className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Dimensions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Dimensions (cm)
              </label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <input
                    type="number"
                    step="0.1"
                    value={totals.dimensions.length}
                    onChange={(e) => handleTotalChange('length', e.target.value)}
                    placeholder="Length"
                    className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    step="0.1"
                    value={totals.dimensions.width}
                    onChange={(e) => handleTotalChange('width', e.target.value)}
                    placeholder="Width"
                    className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    step="0.1"
                    value={totals.dimensions.height}
                    onChange={(e) => handleTotalChange('height', e.target.value)}
                    placeholder="Height"
                    className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Add Package Button */}
            <button
              type="button"
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 mt-4"
              onClick={handleAddPackage}
            >
              Add Package
            </button>
          </div>
        </div>
      </div>

      {/* Package List Table */}
      {packageRows.length > 0 && (
        <div className="mt-8 bg-white dark:bg-gray-800 shadow rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Package No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Package In Explanation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Qty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Gross Weight
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Net Weight
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  HS Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Dimensions
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {packageRows.map((row) => (
                row.items.map((item, itemIndex) => (
                  <tr key={`${row.id}-${itemIndex}`}>
                    {itemIndex === 0 && (
                      <td 
                        rowSpan={row.items.length} 
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white align-top"
                      >
                        {row.packageNo}
                      </td>
                    )}
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {item.product.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {item.quantity}
                    </td>
                    {itemIndex === 0 && (
                      <>
                        <td 
                          rowSpan={row.items.length} 
                          className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white align-top"
                        >
                          {row.grossWeight}
                        </td>
                        <td 
                          rowSpan={row.items.length} 
                          className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white align-top"
                        >
                          {row.netWeight}
                        </td>
                      </>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {item.product.hsCode}
                    </td>
                    {itemIndex === 0 && (
                      <>
                        <td 
                          rowSpan={row.items.length} 
                          className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white align-top"
                        >
                          {`${row.dimensions.length} × ${row.dimensions.width} × ${row.dimensions.height}`}
                        </td>
                        <td 
                          rowSpan={row.items.length} 
                          className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium align-top"
                        >
                          <button
                            onClick={() => handleEditPackage(row)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this package?')) {
                                setPackageRows(prev => prev.filter(p => p.id !== row.id));
                              }
                            }}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            Delete
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {editingPackage && (
        <EditPackageModal
          isOpen={Boolean(editingPackage)}
          onClose={() => setEditingPackage(null)}
          onSave={handleSavePackage}
          packageData={editingPackage}
          allProducts={products}
        />
      )}
    </div>
  );
}; 