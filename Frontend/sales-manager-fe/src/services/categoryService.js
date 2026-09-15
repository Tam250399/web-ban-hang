import { BASE_URL, request } from './apiClient'

const CAT  = `${BASE_URL}/category/product-categories`
const UNIT = `${BASE_URL}/category/unit-types`
const NAME = `${BASE_URL}/category/product-names`

/**
 * Dịch vụ API quản lý danh mục sản phẩm, đơn vị tính và tên mẫu sản phẩm
 */
export const categoryService = {
  getCategories:  ()         => request(CAT),
  getHomeCategories: ()      => request(`${CAT}/home`),
  createCategory: (data)     => request(CAT, { method: 'POST', body: data }),
  updateCategory: (id, data) => request(`${CAT}/${id}`, { method: 'PUT', body: data }),
  deleteCategory: (id)       => request(`${CAT}/${id}`, { method: 'DELETE' }),

  getUnitTypes:  ()         => request(UNIT),
  createUnitType:(data)     => request(UNIT, { method: 'POST', body: data }),
  updateUnitType:(id, data) => request(`${UNIT}/${id}`, { method: 'PUT', body: data }),
  deleteUnitType:(id)       => request(`${UNIT}/${id}`, { method: 'DELETE' }),

  getProductNames:   ()         => request(NAME),
  createProductName: (data)     => request(NAME, { method: 'POST', body: data }),
  updateProductName: (id, data) => request(`${NAME}/${id}`, { method: 'PUT', body: data }),
  deleteProductName: (id)       => request(`${NAME}/${id}`, { method: 'DELETE' }),
}
