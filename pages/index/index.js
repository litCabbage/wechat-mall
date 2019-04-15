//index.js
//获取应用实例
const app = getApp()
const api = require('../../utils/request.js')
Page({
  data: {
    autoplay: true,
    interval: 3000,
    duration: 1000,
    swiperCurrent: 0,
    selectCurrent: 0,
    activeCategoryId: 0,
    categories: [],
    goods: [],
    noticeList: [],
    coupons: [],
    scrollTop: 0,
    loadingMoreHidden: true,
    hasNoCoupons: true,
    indicator: true,
    searchInput: '',
    curPage: 1,
    pageSize: 20
  },

  onLoad: function () {
    let that = this
    wx.setNavigationBarTitle({
      title: wx.getStorageSync('mallName')
    })
    /**
     * 示例：
     * 调用接口封装方法
     */
    api.fetchRequest({
        url: 'banner/list',
        data: {
          key: 'mallName'
        },
        cache: 10
      })
      .then(res => {
        if (res.data.code == 404) {
          wx.showModal({
            title: '提示',
            content: '请在后台添加 banner 图片',
            showCancel: false
          })
        } else {
          that.setData({
            banners: res.data.data
          })
        }
      }).catch(res => {
        wx.showToast({
          title: res.data.msg,
          icon: 'none'
        })
      })

    wx.request({
      url: 'https://api.it120.cc/' + app.globalData.subDomain + '/shop/goods/category/all',
      success: res => {
        let categories = [{
          id: 0,
          name: '全部'
        }]
        if (res.data.code == 0) {
          // 把res.data.data这个数组里面的内容都push到categories里面
          [].push.apply(categories, res.data.data)
        }
        that.setData({
          categories: categories,
          activeCategoryId: 0,
          curPage: 1
        })
        that.getGoodsList()
      }
    })

    this.getNotice()
    this.getCoupons()
  },
  reset() {
    this.setData({
      curPage: 1
    })
  },
  // 事件处理函数
  swiperchange(e) {
    this.setData({
      swiperCurrent: e.detail.current
    })
  },
  tapBanner(e) {
    if (e.currentTarget.dataset.id != 0) {
      wx.navigateTo({
        url: '/pages/goods-details/index?id=' + e.currentTarget.dataset.id
      })
    }
  },
  tabClick(e) {
    this.setData({
      activeCategoryId: e.currentTarget.id,
      curPage: 1
    })
    this.getGoodsList()
  },
  toDetailsTap(e) {
    wx.navigateTo({
      url: '/pages/goods-details/index?id=' + e.currentTarget.dataset.id
    })
  },
  getGoodsList(append) {
    let categoryId = this.data.activeCategoryId == 0 ? '' : this.data.activeCategoryId
    let that = this
    wx.showLoading({
      'mask': true
    })
    api.fetchRequest({
        url: 'shop/goods/list',
        data: {
          categoryId: categoryId,
          nameLike: that.data.searchInput,
          page: this.data.curPage,
          pageSize: this.data.pageSize
        }
      })
      .then(res => {
        wx.hideLoading()
        if (res.data.code == 404 || res.data.code == 700) {
          let newData = {
            loadingMoreHidden: false
          }
          if (!append) {
            newData.goods = []
          }
          that.setData(newData)
          return
        }
        let goods = []
        if (append) {
          goods = that.data.goods
        }
        [].push.apply(goods, res.data.data)
        that.setData({
          loadingMoreHidden: true,
          goods: goods
        })
      })
  },
  getNotice() {
    let that = this
    api.fetchRequest({
        url: 'notice/list',
        data: {
          pageSize: 5
        }
      })
      .then(res => {
        if (res.data.code == 0) {
          that.setData({
            noticeList: res.data.data
          })
        }
      })
  },
  getCoupons() {
    let that = this
    api.fetchRequest({
        url: 'discounts/coupons',
        data: {
          type: ''
        }
      })
      .then(res => {
        if (res.data.code == 0) {
          that.setData({
            hasNoCoupons: false,
            coupons: res.data.data
          })
        }
      })
  },
  receiveCoupon(e) {
    let that = this
    api.fetchRequest({
      url: 'discounts/fetch',
      data: {
        id: e.currentTarget.dataset.id,
        token: wx.getStorageSync('token')
      }
    })
    .then(res => {
      if (res.data.code == 20001 || res.data.code == 20002) {
        wx.showModal({
          title: '错误',
          content: '来晚了',
          showCancel: false
        })
        return
      }
      if (res.data.code == 20003) {
        wx.showModal({
          title: '错误',
          content: '你领过了，别贪心哦~',
          showCancel: false
        })
        return
      }
      if (res.data.code == 30001) {
        wx.showModal({
          title: '错误',
          content: '您的积分不足',
          showCancel: false
        })
        return
      }
      if (res.data.code == 20004) {
        wx.showModal({
          title: '错误',
          content: '已过期~',
          showCancel: false
        })
        return
      }
      if (res.data.code == 0) {
        wx.showModal({
          title: '成功',
          content: '领取成功，赶紧去下单吧~',
          showCancel: false
        })
      } else {
        wx.showModal({
          title: '错误',
          content: res.data.msg,
          showCancel: false
        })
      }
    })
  },
  toSearch() {
    this.reset()
    this.getGoodsList()
  },
  listenerSearchInput(e) {
    this.setData({
      searchInput: e.detail.value
    })
  },
  onReachBottom() {
    this.setData({
      curPage: this.data.curPage + 1
    })
    this.getGoodsList(true)
  },
  onPullDownRefresh() {
    this.reset()
    this.getGoodsList()
  },
  onPageScroll(e) {
    this.setData({
      scrollTop: e.scrollTop
    })
  },
  onShareAppMessage() {
    return {
      title: wx.getStorageSync('mallName') + '———' + app.globalData.shareProfile,
      path: '/pages/index/index',
      success: res => {
        console.log('成功')
      },
      fial: res => {
        console.log('失败')
      }
    }
  }
})