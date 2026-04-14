import request from '@/utils/request'

/**
 * 获取甘特图数据
 * @param {Object} query - 查询参数
 * @param {string} query.orgUnit - 车间
 * @param {string} query.machineId - 机台ID
 * @param {string} query.status - 任务状态
 * @param {string} query.startDate - 开始日期
 * @param {string} query.endDate - 结束日期
 */
export function getGanttData(query) {
  return request({
    url: '/pps/gantt/data',
    method: 'get',
    params: query,
  })
}

/**
 * 获取机台列表（用于筛选）
 */
export function getMachineList() {
  return request({
    url: '/master/machine/list',
    method: 'get',
  })
}

/**
 * 模拟甘特图数据（开发阶段使用）
 */
export function getMockGanttData(query = {}) {
  // 模拟延迟
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockData = [
        {
          resourceId: 'M1',
          name: '注塑机#1',
          orgUnit: '车间1',
          items: [
            {
              taskId: 'T001',
              batchId: 'B001',
              opCode: 'INJECT',
              status: 'SCHEDULED',
              start: '2026-01-13 08:00:00',
              end: '2026-01-13 10:30:00',
            },
            {
              taskId: 'T002',
              batchId: 'B002',
              opCode: 'INJECT',
              status: 'RUNNING',
              start: '2026-01-13 11:00:00',
              end: '2026-01-13 14:30:00',
            },
            {
              taskId: 'T003',
              batchId: 'B003',
              opCode: 'INJECT',
              status: 'SCHEDULED',
              start: '2026-01-13 15:00:00',
              end: '2026-01-13 17:00:00',
            },
          ],
        },
        {
          resourceId: 'M2',
          name: '注塑机#2',
          orgUnit: '车间1',
          items: [
            {
              taskId: 'T004',
              batchId: 'B004',
              opCode: 'INJECT',
              status: 'COMPLETED',
              start: '2026-01-13 08:00:00',
              end: '2026-01-13 11:00:00',
            },
            {
              taskId: 'T005',
              batchId: 'B005',
              opCode: 'INJECT',
              status: 'RUNNING',
              start: '2026-01-13 11:30:00',
              end: '2026-01-13 15:00:00',
            },
          ],
        },
        {
          resourceId: 'M3',
          name: '注塑机#3',
          orgUnit: '车间2',
          items: [
            {
              taskId: 'T006',
              batchId: 'B006',
              opCode: 'INJECT',
              status: 'SCHEDULED',
              start: '2026-01-13 09:00:00',
              end: '2026-01-13 12:00:00',
            },
            {
              taskId: 'T007',
              batchId: 'B007',
              opCode: 'INJECT',
              status: 'SCHEDULED',
              start: '2026-01-13 13:00:00',
              end: '2026-01-13 16:30:00',
            },
          ],
        },
        {
          resourceId: 'M4',
          name: '注塑机#4',
          orgUnit: '车间2',
          items: [
            {
              taskId: 'T008',
              batchId: 'B008',
              opCode: 'INJECT',
              status: 'PAUSED',
              start: '2026-01-13 08:30:00',
              end: '2026-01-13 10:00:00',
            },
          ],
        },
        {
          resourceId: 'M5',
          name: '注塑机#5',
          orgUnit: '车间3',
          items: [
            {
              taskId: 'T009',
              batchId: 'B009',
              opCode: 'INJECT',
              status: 'SCHEDULED',
              start: '2026-01-14 08:00:00',
              end: '2026-01-14 11:00:00',
            },
            {
              taskId: 'T010',
              batchId: 'B010',
              opCode: 'INJECT',
              status: 'SCHEDULED',
              start: '2026-01-14 12:00:00',
              end: '2026-01-14 15:30:00',
            },
          ],
        },
      ]

      // 应用筛选
      let filteredData = mockData

      if (query.orgUnit) {
        filteredData = filteredData.filter((item) => item.orgUnit === query.orgUnit)
      }

      if (query.machineId) {
        filteredData = filteredData.filter((item) => item.resourceId === query.machineId)
      }

      if (query.status) {
        filteredData = filteredData.map((item) => ({
          ...item,
          items: item.items.filter((task) => task.status === query.status),
        }))
        filteredData = filteredData.filter((item) => item.items.length > 0)
      }

      resolve({
        code: 200,
        msg: '操作成功',
        data: filteredData,
      })
    }, 300)
  })
}
