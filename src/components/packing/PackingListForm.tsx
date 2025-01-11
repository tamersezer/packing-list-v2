import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productService, packingListService } from '../../services/api';
import type { Product } from '../../types/Product';
import type { PackingList, PackageRow, PackageRange } from '../../types/PackingList';
import { validatePackageRow, calculatePackingListTotals } from '../../types/PackingList';
import { toast } from 'react-toastify';
import { EditPackageModal } from './EditPackageModal';
import { LoadingSpinner } from '../common/LoadingSpinner';

type PackageType = 'pallet' | 'carton';

export const PackingListForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [packingList, setPackingList] = useState<PackingList>({
    name: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'draft',
    items: [],
    totalGrossWeight: 0,
    totalNetWeight: 0,
    totalNumberOfBoxes: 0,
    totalVolume: 0
  });

  const [packageType, setPackageType] = useState<PackageType>('pallet');
  const [nextPackageNo, setNextPackageNo] = useState(1);
  const [products, setProducts] = useState<Product[]>([]);
  const [editingPackage, setEditingPackage] = useState<PackageRow | null>(null);
  const [packageRange, setPackageRange] = useState<PackageRange>({
    start: 1,
    end: 1
  });

  const PALLET_WEIGHT = 24; // Sabit palet ağırlığı

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsData, listData] = await Promise.all([
          productService.getAll(),
          id ? packingListService.getById(id) : null
        ]);

        setProducts(productsData);
        if (listData) {
          setPackingList(listData);
        }
      } catch (error) {
        toast.error('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Calculate totals
  const updateTotals = useCallback(() => {
    const totals = calculatePackingListTotals(packingList.items);
    
    // Toplam kutu sayısını hesapla - range'i dikkate almadan
    const totalBoxes = packingList.items.reduce((total, item) => {
      // Her paketin içindeki ürünlerin kutu sayısını hesapla
      const packageBoxes = item.items.reduce((boxTotal, packageItem) => {
        return boxTotal + (packageItem.quantity / packageItem.variant.boxQuantity);
      }, 0);
      
      return total + packageBoxes;
    }, 0);

    setPackingList(prev => ({
      ...prev,
      totalGrossWeight: totals.grossWeight,
      totalNetWeight: totals.netWeight,
      totalNumberOfBoxes: Math.ceil(totalBoxes),
      totalVolume: totals.totalVolume
    }));
  }, [packingList.items]);

  useEffect(() => {
    updateTotals();
  }, [updateTotals]);

  // Son paket numarasını bul
  const findLastPackageNumber = useCallback(() => {
    if (packingList.items.length === 0) return 1;

    return packingList.items.reduce((maxNo, item) => {
      // Eğer packageRange varsa end değerini, yoksa packageNo'yu kontrol et
      const currentNo = item.packageRange 
        ? item.packageRange.end
        : parseInt(item.packageNo);
      return Math.max(maxNo, currentNo);
    }, 0) + 1;
  }, [packingList.items]);

  // Component mount olduğunda veya items değiştiğinde son numarayı güncelle
  useEffect(() => {
    const lastNo = findLastPackageNumber();
    setNextPackageNo(lastNo);
  }, [findLastPackageNumber]);

  // Paket numarası formatlaması
  const formatPackageNo = (packageType: PackageType, start: number, end: number) => {
    if (packageType === 'pallet' || start === end) {
      return start.toString();
    }
    return `${start} to ${end}`;
  };

  const handleAddPackage = () => {
    if (packingList.status === 'completed') {
      const confirmDraft = window.confirm(
        'This packing list is completed. You need to convert it to draft to make changes. Do you want to convert it to draft?'
      );
      if (confirmDraft) {
        setPackingList(prev => ({
          ...prev,
          status: 'draft',
          updatedAt: new Date().toISOString()
        }));
      }
      return;
    }

    if (packageType === 'carton' && packageRange.end < packageRange.start) {
      toast.error('End package number cannot be less than start package number');
      return;
    }

    const newPackage: PackageRow = {
      id: crypto.randomUUID(),
      packageNo: formatPackageNo(packageType, packageRange.start, packageRange.end),
      packageRange: packageType === 'carton' ? packageRange : undefined,
      items: [],
      grossWeight: packageType === 'pallet' ? PALLET_WEIGHT : 0,
      netWeight: 0,
      dimensions: packageType === 'pallet' 
        ? { length: 80, width: 120, height: 0 }
        : { length: 0, width: 0, height: 0 }
    };

    setPackingList(prev => ({
      ...prev,
      items: [...prev.items, newPackage]
    }));

    // Sonraki paket numarasını güncelle
    const nextNo = packageType === 'carton' ? packageRange.end + 1 : nextPackageNo + 1;
    setNextPackageNo(nextNo);
    setPackageRange({ start: nextNo, end: nextNo });
    setEditingPackage(newPackage);
  };

  const handleSavePackage = (updatedPackage: PackageRow) => {
    const errors = validatePackageRow(updatedPackage);
    if (errors.length > 0) {
      errors.forEach(error => toast.error(error));
      return;
    }

    // Eğer palet ise ve henüz palet ağırlığı eklenmemişse ekle
    const isPallet = updatedPackage.dimensions.length === 80 && updatedPackage.dimensions.width === 120;
    const finalPackage = {
      ...updatedPackage,
      grossWeight: isPallet 
        ? updatedPackage.grossWeight + PALLET_WEIGHT 
        : updatedPackage.grossWeight
    };

    setPackingList(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.id === finalPackage.id ? finalPackage : item
      )
    }));
    setEditingPackage(null);
  };

  const handleDeletePackage = (packageId: string) => {
    if (packingList.status === 'completed') {
      const confirmDraft = window.confirm(
        'This packing list is completed. You need to convert it to draft to make changes. Do you want to convert it to draft?'
      );
      if (confirmDraft) {
        setPackingList(prev => ({
          ...prev,
          status: 'draft',
          updatedAt: new Date().toISOString(),
          items: prev.items.filter(item => item.id !== packageId)
        }));
      }
      return;
    }

    setPackingList(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== packageId)
    }));
  };

  // Save packing list
  const handleSave = async () => {
    try {
      const updatedPackingList = {
          ...packingList,
        updatedAt: new Date().toISOString()
        };

        if (id) {
          await packingListService.update(id, updatedPackingList);
        } else {
        await packingListService.create(updatedPackingList);
      }

      toast.success('Packing list saved successfully');
      navigate('/packing-list');
    } catch (error) {
      toast.error('Failed to save packing list');
    }
  };

  const handleEditPackage = (pkg: PackageRow) => {
    if (packingList.status === 'completed') {
      const confirmDraft = window.confirm(
        
      );
      if (confirmDraft) {
        setPackingList(prev => ({
          ...prev,
          status: 'draft',
          updatedAt: new Date().toISOString()
        }));
        setEditingPackage(pkg);
      }
      return;
    }
    setEditingPackage(pkg);
  };

  if (isLoading) {
    return <LoadingSpinner text="Loading packing list..." />;
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl py-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            value={packingList.name}
            onChange={(e) => setPackingList(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Enter Packing List Name"
            className="w-full px-4 py-2 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
          />
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {packingList.status.charAt(0).toUpperCase() + packingList.status.slice(1)}
          </span>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Save
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left Panel - Package Creation */}
        <div className="col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Add New Package</h3>
            
            {/* Package Type Selection */}
            <div className="flex items-center space-x-4 mb-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  value="pallet"
                  checked={packageType === 'pallet'}
                  onChange={(e) => setPackageType(e.target.value as PackageType)}
                  className="form-radio text-blue-600 dark:text-blue-400"
                />
                <span className="ml-2 text-gray-900 dark:text-white">Pallet</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  value="carton"
                  checked={packageType === 'carton'}
                  onChange={(e) => setPackageType(e.target.value as PackageType)}
                  className="form-radio"
                />
                <span className="ml-2 text-gray-900 dark:text-white">Carton</span>
              </label>
            </div>

            {/* Package Number Input */}
            <div className="flex items-center space-x-4 mb-4">
              {packageType === 'carton' ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="1"
                    value={packageRange.start}
                    onChange={(e) => setPackageRange(prev => ({ 
                      ...prev, 
                      start: parseInt(e.target.value) || prev.start 
                    }))}
                    className="w-20 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                  <span className="text-gray-700 dark:text-gray-300">to</span>
                  <input
                    type="number"
                    min="1"
                    value={packageRange.end}
                    onChange={(e) => setPackageRange(prev => ({ 
                      ...prev, 
                      end: parseInt(e.target.value) || prev.end 
                    }))}
                    className="w-20 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              ) : (
                <input
                  type="number"
                  value={nextPackageNo}
                  onChange={(e) => setNextPackageNo(parseInt(e.target.value) || 1)}
                  className="w-20 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  min="1"
                />
              )}

              <button
                onClick={handleAddPackage}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add Package
              </button>
            </div>
          </div>

          {/* Package List */}
          <div className="space-y-4">
            {packingList.items.map(pkg => (
              <div key={pkg.id} className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="flex-1">
                  <div className="text-lg font-medium text-gray-900 dark:text-white">
                    {pkg.packageRange && pkg.packageRange.start === pkg.packageRange.end 
                      ? pkg.packageRange.start.toString()
                      : pkg.packageNo
                    }
                  </div>
                  <div className="mt-2 space-y-1">
                    {pkg.items.map((item, index) => (
                      <div key={index} className="text-sm text-gray-600 dark:text-gray-300">
                        {item.product.name} - {item.variant.name} ({item.quantity} pcs)
                      </div>
                    ))}
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Dimensions: {pkg.dimensions.length}x{pkg.dimensions.width}x{pkg.dimensions.height} cm
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Weight: {pkg.grossWeight.toFixed(1)} / {pkg.netWeight.toFixed(1)} kg
                    </div>
                    {pkg.hsCode && (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        HS Code: {pkg.hsCode}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditPackage(pkg)}
                    className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeletePackage(pkg.id)}
                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel - Totals */}
        <div className="space-y-6">
          {/* Status Switch */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Status</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {packingList.status === 'draft' ? 'Draft' : 'Completed'}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={packingList.status === 'completed'}
                  onChange={(e) => {
                    const newStatus = e.target.checked ? 'completed' : 'draft';
                    setPackingList(prev => ({
                      ...prev,
                      status: newStatus,
                      updatedAt: new Date().toISOString()
                    }));
                  }}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Totals</h3>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Total Packages:</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {packingList.items.reduce((total, item) => {
                    if (item.packageRange) {
                      return total + (item.packageRange.end - item.packageRange.start + 1);
                    }
                    return total + 1;
                  }, 0)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Total Boxes:</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {packingList.totalNumberOfBoxes}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Total Volume:</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {Number(packingList.totalVolume).toFixed(1)} m³
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Total Weight:</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {Number(packingList.totalGrossWeight).toFixed(1)} / {Number(packingList.totalNetWeight).toFixed(1)} kg
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Package Modal */}
      {editingPackage && (
        <EditPackageModal
          isOpen={!!editingPackage}
          onClose={() => setEditingPackage(null)}
          onSave={handleSavePackage}
          packageData={editingPackage}
          allProducts={products}
        />
      )}
    </div>
  );
}; 