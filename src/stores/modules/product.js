import { listProduct } from '@/api/demand/product'

const useProductStore = defineStore('product', {
  state: () => ({
    productList: [],
  }),
  actions: {
    /**
     * 获取产品列表（从后端）
     * 用于初始化或刷新产品列表
     */
    async getProductList() {
      return new Promise((resolve, reject) => {
        listProduct()
          .then((response) => {
            this.productList = response.rows
            resolve(response.rows)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    /**
     * 添加产品到仓库
     * @param {Object} product - 产品对象
     */
    addProduct(product) {
      this.productList.push(product)
    },

    /**
     * 更新仓库中的产品
     * @param {Object} product - 产品对象（必须包含 productId）
     */
    updateProduct(product) {
      const index = this.productList.findIndex((item) => item.productId === product.productId)
      if (index !== -1) {
        this.productList[index] = product
      }
    },

    /**
     * 从仓库中删除产品
     * @param {Number|Array} productIds - 产品ID或产品ID数组
     */
    deleteProduct(productIds) {
      const ids = Array.isArray(productIds) ? productIds : [productIds]
      this.productList = this.productList.filter((item) => !ids.includes(item.productId))
    },
  },
})

export default useProductStore
