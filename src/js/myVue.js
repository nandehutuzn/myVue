// 这里是MyVue的构造函数，新建MyVue对象时传入的对象即为options参数
function MyVue(options) {
    this.$options = options || {};
    let data = this._data = this.$options.data;
    let me = this;
    
    // 首先需要进行一个数据代理，即当访问MyVue的属性时其实是访问vm.data的属性
    // 即 vm.xxx ===  vm._data.xxx
    Object.keys(data).forEach(key => me._proxyData(key));

    // 对计算属性进行初始化，也是需要绑定到vm自身上
    this._initComputed();

    // 监控data对象的数据变化
    observe(data, this);
}

MyVue.prototype = {
    _proxyData: function(key){
        let me = this;
        Object.defineProperty(me, key, {
            configurable: false,
            enumerable: true,
            get: function proxyGetter(){
                return me._data[key];
            },
            set: function proxySetter(newVal){
                me._data[key] = newVal;
            }
        });
    },

    _initComputed: function(){
        let me = this;
        let computed = this.$options.computed;
        if(typeof computed === 'object'){
            Object.keys(computed).forEach(key => {
                Object.defineProperty(me, key, {
                    get: typeof computed[key] === 'function' ? computed[key] : computed[key].get,
                    set: function(){}
                });
            });
        }
    }
}