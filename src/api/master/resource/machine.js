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
