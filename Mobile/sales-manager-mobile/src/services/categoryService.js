import { request } from './apiClient'

const CAT = '/category/product-categories'
const UNIT = '/category/unit-types'
const NAME = '/category/product-names'

export const categoryService = {
  // Danh mục sản phẩm
  getCategories: () => request(CAT),
  createCategory: (data) => request(CAT, { method: 'POST', body: data }),
  updateCategory: (id, data) => request(`${CAT}/${id}`, { method: 'PUT', body: data }),
  deleteCategory: (id) => request(`${CAT}/${id}`, { method: 'DELETE' }),

  // Đơn vị tính
  getUnitTypes: () => request(UNIT),
  createUnitType: (data) => request(UNIT, { method: 'POST', body: data }),
  updateUnitType: (id, data) => request(`${UNIT}/${id}`, { method: 'PUT', body: data }),
  deleteUnitType: (id) => request(`${UNIT}/${id}`, { method: 'DELETE' }),

  // Tên sản phẩm mẫu
  getProductNames: () => request(NAME),
  createProductName: (data) => request(NAME, { method: 'POST', body: data }),
  updateProductName: (id, data) => request(`${NAME}/${id}`, { method: 'PUT', body: data }),
  deleteProductName: (id) => request(`${NAME}/${id}`, { method: 'DELETE' }),
}
