import request from '@/utils/request'

// 查询注塑机扩展信息列表
export function listMachine(query) {
  return request({
    url: '/master/resource/machine/list',
    method: 'get',
    params: query,
  })
}

// 查询注塑机扩展信息详细
export function getMachine(machineId) {
  return request({
    url: '/master/resource/machine/' + machineId,
    method: 'get',
  })
}

// 新增注塑机扩展信息
export function addMachine(data) {
  return request({
    url: '/master/resource/machine',
    method: 'post',
    data: data,
  })
}

// 修改注塑机扩展信息
export function updateMachine(data) {
  return request({
    url: '/master/resource/machine',
    method: 'put',
    data: data,
  })
}

// 删除注塑机扩展信息
export function delMachine(machineId) {
  return request({
    url: '/master/resource/machine/' + machineId,
    method: 'delete',
  })
}

// 设置机器为故障状态（AVAILABLE → DOWN）
export function setMachineDown(machineId) {
  return request({
    url: '/master/resource/machine/down/' + machineId,
    method: 'put',
  })
}

// 设置机器为保养状态（AVAILABLE → MAINTENANCE）
export function setMachineMaintenance(machineId) {
  return request({
    url: '/master/resource/machine/maintenance/' + machineId,
    method: 'put',
  })
}

// 恢复机器状态（DOWN/MAINTENANCE → AVAILABLE）
export function restoreMachine(machineId) {
  return request({
    url: '/master/resource/machine/restore/' + machineId,
    method: 'put',
  })
}
