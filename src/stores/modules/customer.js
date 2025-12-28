import { listCustomer } from '@/api/demand/customer'

const useCustomerStore = defineStore('customer', {
  state: () => ({
    customerList: [],
  }),
  actions: {
    /**
     * 获取客户列表（从后端）
     * 用于初始化或刷新客户列表
     */
    async getCustomerList() {
      return new Promise((resolve, reject) => {
        listCustomer()
          .then((response) => {
            this.customerList = response.rows
            resolve(response.rows)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    /**
     * 添加客户到仓库
     * @param {Object} customer - 客户对象
     */
    addCustomer(customer) {
      this.customerList.push(customer)
    },

    /**
     * 更新仓库中的客户
     * @param {Object} customer - 客户对象（必须包含 customerId）
     */
    updateCustomer(customer) {
      const index = this.customerList.findIndex((item) => item.customerId === customer.customerId)
      if (index !== -1) {
        this.customerList[index] = customer
      }
    },

    /**
     * 从仓库中删除客户
     * @param {Number|Array} customerIds - 客户ID或客户ID数组
     */
    deleteCustomer(customerIds) {
      const ids = Array.isArray(customerIds) ? customerIds : [customerIds]
      this.customerList = this.customerList.filter((item) => !ids.includes(item.customerId))
    },
  },
})

export default useCustomerStore
