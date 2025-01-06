function paginate(items, page = 1, limit = 10) {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  
  const paginatedItems = items.slice(startIndex, endIndex);
  
  return {
    items: paginatedItems,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(items.length / limit),
      totalItems: items.length,
      hasNextPage: endIndex < items.length,
      hasPrevPage: page > 1
    }
  };
}

module.exports = { paginate }; 