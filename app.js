//app.js
App({
    onLaunch: function () {
        let that = this;
        /**
         * 初次加载判断网络情况
         * 无网络状态下根据实际情况进行调整
         */
        wx.getNetworkType({
            success(res) {
                const networkType = res.networkType;
                if (networkType === 'none') {
                    that.globalData.isConnected = false;
                    wx.showToast({
                        title: '当前无网络',
                        icon: 'loading',
                        duration: 2000
                    });
                }
            }
        })

        /**
         * 监听网络状态变化
         * 可根据业务需求进行调整
         */
        wx.onNetworkStatusChange((res) => {
            if (!res.isConnected) {
                that.globalData.isConnected = false;
                wx.showToast({
                    title: '网络已断开',
                    icon: 'loading',
                    duration: 2000,
                    complete: () => {
                        that.goStartIndexPage();
                    }
                });
            } else {
                that.globalData.isConnected = true;
                wx.hideToast();
            }
        });

        // 获取商城名称
        wx.request({
            url: 'https://api.it120.cc/' + that.globalData.subDomain + '/config/get-value',
            data: {
                key: 'mallName'
            },
            success: (res) => {
                if (res.data.code == 0) {
                    wx.setStorageSync('mallName', res.data.data.value);
                }
            }
        })

        // 判断是否登录
        let token = wx.getStorageSync('token')
        if (!token) {
            that.goLoginPageTimeOut()
            return
        }
        wx.request({
            url: 'https://api.it120.cc/' + that.globalData.subDomain + '/user/check-token',
            data: {
                token: token
            },
            success: (res) => {
                if (res.data.code != 0) {
                    wx.removeStorageSync('token')
                    that.goLoginPageTimeOut
                }
            }
        })
        // 获取砍价设置
        wx.request({
            url: 'https://api.it120.cc/' + that.globalData.subDomain + '/shop/goods/kanjia/list',
            success: res => {
                if (res.data.code == 0) {
                    that.globalData.kanjiaList = res.data.data.result;
                }
            }
        })
    },
    goLoginPageTimeOut() {
        setTimeout(function () {
            // 保留当前页面，跳转到其他页面
            wx.navigateTo({
                url: '/pages/authorize/index'
            })
        }, 1000)
    },
    goStartIndexPage() {
        let that = this;
        setTimeout(function () {
            // 跳转到其他非tab页面
            wx.redirectTo({
                url: '/pages/start/start'
            });
            // 跳tab页，必须用switchTab
            // wx.switchTab({
            //     url: '/pages/index/index'
            // });
        }, 1000);
    },
    globalData: {
        userInfo: null,
        subDomain: 'litCabbage',
        versition: '4.1.0',
        note: '增加小程序购物单支持',
        appid: 'wxd35ba1d4a85692ab',
        isConnected: true, // 网络是否连接
        _path: 'https://api.it120.cc/litCabbage/' // 原项目路由配置在页面中，改为配置项
    }
})