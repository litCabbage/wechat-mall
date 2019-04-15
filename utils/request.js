const app = getApp()
let REQUEST_CACHE = []

/**
 * 简单请求封装
 * 利用es6的参数结构赋值，不需要记住参数顺序，只要记住参数名称即可
 * 并且带来的好处还有，比如我不想输入method，只想用默认的即可，但是cache我想用，那么需要用什么，你在调用时输入即可
 * url: 请求地址
 * data: 请求内容
 * method: 请求方法
 * cache: 缓存时长（单位：秒）
 */
// 传统定义方法
// function FetchRequest(url, data, method = 'GET', cache = 0) {
// }
// 传统使用FetchRequest('/shop/list','','',1000)
// es6结构定义方法
// function FetchRequest({url, data, method = 'GET', cache = 0}) {
// }
// 使用FetchRequest({url:'/shop/list',cache: 10000)
function FetchRequest({url, data, method = 'GET', cache = 0}) {
  let request_key = GetStorageKey(url, method)
  if (cache) {
    return new Promise(Storage)
  } else {
    return new Promise(Request)
  }

  /**
   * 缓存相关
   */
  function Storage(resolve, reject) {
    wx.getStorage({
      key: request_key,
      success: StorageSuccess,
      fail: StorageError
    })

    /**
     * 成功回调
     */
    function StorageSuccess(store) {
      if (CheckCache(store.data)) {
        resolve(store.data)
      } else {
        Request(resolve, reject);
      }
    }

    /**
     * 异常处理
     */
    function StorageError(err) {
      Request(resolve, reject);
    }
  }

  /**
   * 请求接口
   */
  function Request(resolve, reject) {
    if (CheckRequest(request_key)) {
      return
    }
    SaveRequest(request_key)
    wx.request({
      url: app.globalData._path + url,
      method: method.toUpperCase(),
      data: data,
      header: app.globalData.header,
      success: FetchSuccess,
      fail: FetchError,
      complete: RequestOver
    })

    /**
     * 成功回调
     */
    function FetchSuccess(res) {
      SaveCache(res)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        resolve(res)
      } else {
        FetchError(res.data)
        switch (res.statusCode) {
          case 403:
            app.goLoginPageTimeOut()
            break
        }
      }
    }

    /**
     * 异常处理
     */

    function FetchError(err) {
      if (err) {
        wx.showToast({
          title: err.errMsg || err.message,
          icon: 'none',
          duration: 3000
        })
      }
      reject(err)
    }
  }

  /**
   * 保存缓存信息
   */
  function SaveCache(res) {
    if (cache > 0 && res.statusCode >= 200 && res.statusCode < 300) {
      res.timestamp = Date.parse(new Date()) + cache * 1000
      wx.setStorage({
        key: GetStorageKey(url, method),
        data: res
      })
    }
  }

  /**
   * 验证缓存是否过期
   */
  function CheckCache(data) {
    return data.timestamp > Date.parse(new Date())
  }

  /**
   * 请求complete的方法
   */
  function RequestOver() {
    RemoveRequest(request_key)
  }
}

/**
 * 并发请求
 * 没做缓存等处理
 */
function FetchRequestAll(data) {
  return new Promise((resolve, reject) => {
    Promise.all(data).then(res => {
      resolve(res)
    })
  })
}

function CheckRequest(key) {
  return REQUEST_CACHE.indexOf(key) >= 0
}

function SaveRequest(key) {
  let index = REQUEST_CACHE.indexOf(key)
  if (index <= 0) {
    REQUEST_CACHE.push(key)
  }
}

function RemoveRequest(key) {
  let index = REQUEST_CACHE.indexOf(key)
  if (index >= 0) {
    REQUEST_CACHE.splice(index, 1)
  }
}

function GetStorageKey(url, method) {
  return `${method.toUpperCase()}:${url.toUpperCase()}`
}

/**
 * 小程序的promise没有finally方法，自己扩展下
 */

Promise.prototype.finally = function (callback) {
  let Promise = this.constructor
  return this.then(
    value => {
      Promise.resolve(callback()).then(
        () => {
          return value
        }
      )
    },
    reason => {
      Promise.resolve(callback()).then(
        () => {
          throw reason
        }
      )
    }
  )
}

module.exports = {
  fetchRequest: FetchRequest,
  cacheTime: 1800,
  FetchRequestAll: FetchRequestAll
}