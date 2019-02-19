function Observer(data){
    this.data = data;
    this.walk(data);
}

Observer.prototype = {
    walk: function(data) {
        let me = this;
        Object.keys(data).forEach(key => me.convert(key, data[key]));
    },
    convert: function(key, val){
        this.defineReactive(this.data, key, val);
    },
    defineReactive: function(data, key, val){
        let dep = new Dep(); // 每个属性对应一个Dep对象
        let childObj = observe(val); // 如果属性值是object，则该属性值对象也需要被监控

        Object.defineProperty(data, key, {
            enumerable: true,
            configurable: false,
            get: function(){
                if(Dep.target){ // 当观察者Watcher访问data的key属性时，添加对该属性的监控，其他情况不做处理 
                    dep.depend();
                }
                return val;
            },
            set: function(newVal){
                if(val === newVal){
                    return;
                }

                val = newVal;
                // 新的值是object的话，进行监听
                childObj = observe(newVal);
                dep.notify();// 通知订阅者
            }
        })
    }
}

// 监控value对象， vm为value对象上下文
function observe(value, vm){
    // 最开始传入的vm.data肯定是object，data的一些属性值可能也是object，
    // 所以会递归调用该函数来监控data中的所有属性
    if(!value || typeof value !== 'object'){
        return;
    }

    return new Observer(value);
}

var uid = 0;
// 属性订阅容器
function Dep(){
    this.uid = ++uid;
    this.subs = []; // Watcher容器
}

Dep.prototype = {
    addSub: function(sub){
        this.subs.push(sub);
    },
    depend: function(){
        // 在data属性的get方法中建立依赖，Dep.target会指向一个Watcher
        Dep.target.addDep(this);
    },
    removeSub: function(sub){
        let index = this.subs.indexOf(sub);
        if(index !== -1){
            this.subs.splice(index, 1);
        }
    },
    notify: function(){
        // 当data对象的属性发生改变时，会在属性的set方法中触发该函数
        this.subs.forEach(sub => sub.update());
    }
}

Dep.target = null;