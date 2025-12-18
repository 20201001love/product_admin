/**
 * 标签页视图状态管理 Store
 * 管理多标签页（TagsView）的状态，包括已访问的视图、缓存的视图和 iframe 视图
 * 用于实现类似浏览器标签页的功能，支持标签的增删改查操作
 *
 * @module stores/modules/tagsView
 */

const useTagsViewStore = defineStore(
  'tags-view',
  {
    /**
     * 标签页视图状态定义
     */
    state: () => ({
      /**
       * 已访问的视图列表
       * @type {Array<Object>}
       * @description 存储用户访问过的路由视图信息，用于在标签栏显示
       *              每个视图对象包含：path（路由路径）、name（路由名称）、meta（路由元信息）、title（标签标题）等
       *              这些视图会显示在页面上方的标签栏中
       */
      visitedViews: [],

      /**
       * 缓存的视图名称列表
       * @type {Array<string>}
       * @description 存储需要被 keep-alive 缓存的组件名称
       *              用于实现页面缓存功能，切换标签时保持页面状态
       *              只有 meta.noCache 不为 true 的视图才会被缓存
       */
      cachedViews: [],

      /**
       * iframe 视图列表
       * @type {Array<Object>}
       * @description 存储通过 iframe 加载的外链页面视图
       *              用于处理外链（meta.link）类型的路由，这些路由需要在 iframe 中显示
       */
      iframeViews: []
    }),
    /**
     * 状态操作方法
     * 提供对标签页视图的增删改查操作
     */
    actions: {
      /**
       * 添加视图（完整操作）
       * 同时添加到已访问视图和缓存视图
       * 通常在路由导航时调用
       *
       * @param {Object} view - 路由视图对象
       * @param {string} view.path - 路由路径
       * @param {string} view.name - 路由名称（组件名）
       * @param {Object} view.meta - 路由元信息
       * @param {string} view.meta.title - 标签标题
       * @param {boolean} view.meta.noCache - 是否不缓存
       * @param {boolean} view.meta.affix - 是否固定标签（不可删除）
       *
       * @example
       * // 在路由守卫中使用
       * const view = {
       *   path: '/user/list',
       *   name: 'UserList',
       *   meta: { title: '用户列表' }
       * }
       * tagsViewStore.addView(view)
       */
      addView(view) {
        this.addVisitedView(view)
        this.addCachedView(view)
      },

      /**
       * 添加 iframe 视图
       * 用于外链页面，这些页面需要在 iframe 中显示
       *
       * @param {Object} view - 路由视图对象
       * @param {string} view.path - 路由路径
       * @param {Object} view.meta - 路由元信息
       * @param {string} view.meta.title - 标签标题
       * @param {string} view.meta.link - 外链地址（标识为 iframe 视图）
       *
       * @example
       * // 添加外链视图
       * const view = {
       *   path: '/external',
       *   meta: { title: '外部链接', link: 'https://example.com' }
       * }
       * tagsViewStore.addIframeView(view)
       */
      addIframeView(view) {
        // 如果已存在相同路径的 iframe 视图，则不重复添加
        if (this.iframeViews.some(v => v.path === view.path)) return
        // 添加视图，确保有 title 属性
        this.iframeViews.push(
          Object.assign({}, view, {
            title: view.meta.title || 'no-name'
          })
        )
      },

      /**
       * 添加已访问视图
       * 将视图添加到标签栏显示列表中
       *
       * @param {Object} view - 路由视图对象
       *
       * @example
       * // 添加访问记录
       * tagsViewStore.addVisitedView(route)
       */
      addVisitedView(view) {
        // 如果已存在相同路径的视图，则不重复添加
        if (this.visitedViews.some(v => v.path === view.path)) return
        // 添加视图，确保有 title 属性
        this.visitedViews.push(
          Object.assign({}, view, {
            title: view.meta.title || 'no-name'
          })
        )
      },

      /**
       * 添加缓存视图
       * 将组件名称添加到缓存列表，用于 keep-alive 缓存
       *
       * @param {Object} view - 路由视图对象
       * @param {string} view.name - 组件名称（必须）
       * @param {Object} view.meta - 路由元信息
       * @param {boolean} view.meta.noCache - 如果为 true，则不缓存
       *
       * @example
       * // 添加缓存（如果 meta.noCache 不为 true）
       * tagsViewStore.addCachedView(route)
       */
      addCachedView(view) {
        // 如果已存在，则不重复添加
        if (this.cachedViews.includes(view.name)) return
        // 只有 meta.noCache 不为 true 的视图才会被缓存
        if (!view.meta.noCache) {
          this.cachedViews.push(view.name)
        }
      },
      /**
       * 删除视图（完整操作）
       * 同时从已访问视图和缓存视图中删除
       *
       * @param {Object} view - 要删除的路由视图对象
       * @returns {Promise<Object>} 返回删除后的视图列表
       *
       * @example
       * // 删除指定视图
       * tagsViewStore.delView(view).then(result => {
       *   console.log('删除后的视图:', result)
       * })
       */
      delView(view) {
        return new Promise(resolve => {
          this.delVisitedView(view)
          this.delCachedView(view)
          resolve({
            visitedViews: [...this.visitedViews],
            cachedViews: [...this.cachedViews]
          })
        })
      },

      /**
       * 删除已访问视图
       * 从标签栏中移除指定视图
       *
       * @param {Object} view - 要删除的路由视图对象
       * @param {string} view.path - 路由路径
       * @returns {Promise<Array>} 返回删除后的已访问视图列表
       *
       * @example
       * // 删除已访问视图
       * tagsViewStore.delVisitedView({ path: '/user/list' })
       */
      delVisitedView(view) {
        return new Promise(resolve => {
          // 从已访问视图中删除
          for (const [i, v] of this.visitedViews.entries()) {
            if (v.path === view.path) {
              this.visitedViews.splice(i, 1)
              break
            }
          }
          // 同时从 iframe 视图中删除
          this.iframeViews = this.iframeViews.filter(item => item.path !== view.path)
          resolve([...this.visitedViews])
        })
      },

      /**
       * 删除 iframe 视图
       * 从 iframe 视图列表中移除指定视图
       *
       * @param {Object} view - 要删除的路由视图对象
       * @param {string} view.path - 路由路径
       * @returns {Promise<Array>} 返回删除后的 iframe 视图列表
       *
       * @example
       * // 删除 iframe 视图
       * tagsViewStore.delIframeView({ path: '/external' })
       */
      delIframeView(view) {
        return new Promise(resolve => {
          this.iframeViews = this.iframeViews.filter(item => item.path !== view.path)
          resolve([...this.iframeViews])
        })
      },

      /**
       * 删除缓存视图
       * 从缓存列表中移除指定组件，取消 keep-alive 缓存
       *
       * @param {Object} view - 要删除的路由视图对象
       * @param {string} view.name - 组件名称
       * @returns {Promise<Array>} 返回删除后的缓存视图列表
       *
       * @example
       * // 删除缓存
       * tagsViewStore.delCachedView({ name: 'UserList' })
       */
      delCachedView(view) {
        return new Promise(resolve => {
          const index = this.cachedViews.indexOf(view.name)
          // 如果存在则删除
          if (index > -1) {
            this.cachedViews.splice(index, 1)
          }
          resolve([...this.cachedViews])
        })
      },
      /**
       * 删除其他视图（保留当前视图和固定标签）
       * 删除除指定视图和固定标签（affix）外的所有视图
       * 通常用于右键菜单的"关闭其他"功能
       *
       * @param {Object} view - 要保留的路由视图对象
       * @returns {Promise<Object>} 返回删除后的视图列表
       *
       * @example
       * // 关闭其他标签，只保留当前标签和固定标签
       * tagsViewStore.delOthersViews(currentView)
       */
      delOthersViews(view) {
        return new Promise(resolve => {
          this.delOthersVisitedViews(view)
          this.delOthersCachedViews(view)
          resolve({
            visitedViews: [...this.visitedViews],
            cachedViews: [...this.cachedViews]
          })
        })
      },

      /**
       * 删除其他已访问视图
       * 只保留固定标签（affix）和指定视图
       *
       * @param {Object} view - 要保留的路由视图对象
       * @returns {Promise<Array>} 返回删除后的已访问视图列表
       */
      delOthersVisitedViews(view) {
        return new Promise(resolve => {
          // 只保留固定标签（affix）和当前视图
          this.visitedViews = this.visitedViews.filter(v => {
            return v.meta.affix || v.path === view.path
          })
          // 只保留当前视图的 iframe
          this.iframeViews = this.iframeViews.filter(item => item.path === view.path)
          resolve([...this.visitedViews])
        })
      },

      /**
       * 删除其他缓存视图
       * 只保留指定视图的缓存
       *
       * @param {Object} view - 要保留的路由视图对象
       * @returns {Promise<Array>} 返回删除后的缓存视图列表
       */
      delOthersCachedViews(view) {
        return new Promise(resolve => {
          const index = this.cachedViews.indexOf(view.name)
          if (index > -1) {
            // 只保留当前视图的缓存
            this.cachedViews = this.cachedViews.slice(index, index + 1)
          } else {
            // 如果当前视图不在缓存中，则清空所有缓存
            this.cachedViews = []
          }
          resolve([...this.cachedViews])
        })
      },
      /**
       * 删除所有视图（保留固定标签）
       * 删除所有非固定的标签，只保留 meta.affix 为 true 的固定标签
       * 通常用于右键菜单的"关闭所有"功能
       *
       * @param {Object} view - 视图对象（此参数未使用，保留以兼容接口）
       * @returns {Promise<Object>} 返回删除后的视图列表
       *
       * @example
       * // 关闭所有标签，只保留固定标签
       * tagsViewStore.delAllViews()
       */
      delAllViews(_view) {
        return new Promise(resolve => {
          this.delAllVisitedViews(_view)
          this.delAllCachedViews(_view)
          resolve({
            visitedViews: [...this.visitedViews],
            cachedViews: [...this.cachedViews]
          })
        })
      },

      /**
       * 删除所有已访问视图（保留固定标签）
       * 只保留 meta.affix 为 true 的固定标签
       *
       * @param {Object} _view - 视图对象（此参数未使用，保留以兼容接口）
       * @returns {Promise<Array>} 返回删除后的已访问视图列表
       */
      delAllVisitedViews(_view) {
        return new Promise(resolve => {
          // 只保留固定标签（affix）
          const affixTags = this.visitedViews.filter(tag => tag.meta.affix)
          this.visitedViews = affixTags
          // 清空所有 iframe 视图
          this.iframeViews = []
          resolve([...this.visitedViews])
        })
      },

      /**
       * 删除所有缓存视图
       * 清空所有 keep-alive 缓存
       *
       * @param {Object} _view - 视图对象（此参数未使用，保留以兼容接口）
       * @returns {Promise<Array>} 返回空数组
       */
      delAllCachedViews(_view) {
        return new Promise(resolve => {
          this.cachedViews = []
          resolve([...this.cachedViews])
        })
      },
      /**
       * 更新已访问视图
       * 更新指定路径的视图信息（如标题等）
       *
       * @param {Object} view - 要更新的路由视图对象
       * @param {string} view.path - 路由路径（用于查找）
       *
       * @example
       * // 更新视图标题
       * tagsViewStore.updateVisitedView({
       *   path: '/user/list',
       *   meta: { title: '新标题' }
       * })
       */
      updateVisitedView(view) {
        // 查找并更新匹配的视图
        for (let v of this.visitedViews) {
          if (v.path === view.path) {
            v = Object.assign(v, view)
            break
          }
        }
      },

      /**
       * 删除右侧标签
       * 删除指定视图右侧的所有标签（不包括固定标签）
       * 通常用于右键菜单的"关闭右侧"功能
       *
       * @param {Object} view - 基准视图对象（保留此视图及其左侧的标签）
       * @param {string} view.path - 路由路径
       * @returns {Promise<Array>} 返回删除后的已访问视图列表
       *
       * @example
       * // 关闭当前标签右侧的所有标签
       * tagsViewStore.delRightTags(currentView)
       */
      delRightTags(view) {
        return new Promise(resolve => {
          // 查找基准视图的索引
          const index = this.visitedViews.findIndex(v => v.path === view.path)
          if (index === -1) {
            return
          }
          // 过滤：保留索引小于等于基准索引的标签，以及所有固定标签
          this.visitedViews = this.visitedViews.filter((item, idx) => {
            if (idx <= index || (item.meta && item.meta.affix)) {
              return true
            }
            // 删除缓存
            const i = this.cachedViews.indexOf(item.name)
            if (i > -1) {
              this.cachedViews.splice(i, 1)
            }
            // 删除 iframe 视图
            if (item.meta.link) {
              const fi = this.iframeViews.findIndex(v => v.path === item.path)
              this.iframeViews.splice(fi, 1)
            }
            return false
          })
          resolve([...this.visitedViews])
        })
      },

      /**
       * 删除左侧标签
       * 删除指定视图左侧的所有标签（不包括固定标签）
       * 通常用于右键菜单的"关闭左侧"功能
       *
       * @param {Object} view - 基准视图对象（保留此视图及其右侧的标签）
       * @param {string} view.path - 路由路径
       * @returns {Promise<Array>} 返回删除后的已访问视图列表
       *
       * @example
       * // 关闭当前标签左侧的所有标签
       * tagsViewStore.delLeftTags(currentView)
       */
      delLeftTags(view) {
        return new Promise(resolve => {
          // 查找基准视图的索引
          const index = this.visitedViews.findIndex(v => v.path === view.path)
          if (index === -1) {
            return
          }
          // 过滤：保留索引大于等于基准索引的标签，以及所有固定标签
          this.visitedViews = this.visitedViews.filter((item, idx) => {
            if (idx >= index || (item.meta && item.meta.affix)) {
              return true
            }
            // 删除缓存
            const i = this.cachedViews.indexOf(item.name)
            if (i > -1) {
              this.cachedViews.splice(i, 1)
            }
            // 删除 iframe 视图
            if (item.meta.link) {
              const fi = this.iframeViews.findIndex(v => v.path === item.path)
              this.iframeViews.splice(fi, 1)
            }
            return false
          })
          resolve([...this.visitedViews])
        })
      }
    }
  })

export default useTagsViewStore
