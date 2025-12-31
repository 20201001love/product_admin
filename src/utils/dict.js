import useDictStore from '@/stores/modules/dict'
import { getDicts } from '@/api/system/dict/data'

/**
 * 获取字典数据（包含所有项，包括只读项）
 */
export function useDict(...args) {
  const res = ref({})
  return (() => {
    args.forEach((dictType) => {
      res.value[dictType] = []
      const dicts = useDictStore().getDict(dictType)
      if (dicts) {
        res.value[dictType] = dicts
      } else {
        getDicts(dictType).then((resp) => {
          res.value[dictType] = resp.data.map((p) => ({
            label: p.dictLabel,
            value: p.dictValue,
            elTagType: p.listClass,
            elTagClass: p.cssClass,
            isReadonly: p.isReadonly, // 新增：是否只读字段
          }))
          useDictStore().setDict(dictType, res.value[dictType])
        })
      }
    })
    return toRefs(res.value)
  })()
}

/**
 * 获取可编辑的字典数据（过滤掉只读项）
 * 用于表单编辑场景，只返回 isReadonly !== '0' 的选项
 */
export function useEditableDict(...args) {
  const res = ref({})
  return (() => {
    args.forEach((dictType) => {
      res.value[dictType] = []
      const dicts = useDictStore().getDict(dictType)
      if (dicts) {
        // 过滤只读项（isReadonly 为 '0' 的项）
        res.value[dictType] = dicts.filter((item) => item.isReadonly !== '0')
      } else {
        getDicts(dictType).then((resp) => {
          const allDicts = resp.data.map((p) => ({
            label: p.dictLabel,
            value: p.dictValue,
            elTagType: p.listClass,
            elTagClass: p.cssClass,
            isReadonly: p.isReadonly,
          }))
          // 存储完整字典到 store
          useDictStore().setDict(dictType, allDicts)
          // 返回过滤后的可编辑字典
          res.value[dictType] = allDicts.filter((item) => item.isReadonly !== '0')
        })
      }
    })
    return toRefs(res.value)
  })()
}
