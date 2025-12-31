import { listCalendar } from '@/api/master/calendar'

const useCalendarStore = defineStore('calendar', {
  state: () => ({
    calendarList: [],
  }),
  actions: {
    /**
     * 获取日历列表（从后端）
     * 用于初始化或刷新日历列表
     */
    async getCalendarList() {
      return new Promise((resolve, reject) => {
        listCalendar({ pageNum: 1, pageSize: 1000 })
          .then((response) => {
            this.calendarList = response.rows
            resolve(response.rows)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    /**
     * 添加日历到仓库
     * @param {Object} calendar - 日历对象
     */
    addCalendar(calendar) {
      this.calendarList.push(calendar)
    },

    /**
     * 更新仓库中的日历
     * @param {Object} calendar - 日历对象（必须包含 calendarId）
     */
    updateCalendar(calendar) {
      const index = this.calendarList.findIndex((item) => item.calendarId === calendar.calendarId)
      if (index !== -1) {
        this.calendarList[index] = calendar
      }
    },

    /**
     * 从仓库中删除日历
     * @param {Number|Array} calendarIds - 日历ID或日历ID数组
     */
    deleteCalendar(calendarIds) {
      const ids = Array.isArray(calendarIds) ? calendarIds : [calendarIds]
      this.calendarList = this.calendarList.filter((item) => !ids.includes(item.calendarId))
    },
  },
})

export default useCalendarStore
