// 要在视图中用到了data中的属性，才会对该属性进行监控
function Watcher(vm, expOrFn, cb){
    this.cb = cb; // 监控值变化后的回调
    this.vm = vm;
    this.expOrFn = expOrFn;
    this.depIds = {};
    //console.log('Watcher ', expOrFn);
    if(typeof expOrFn === 'function'){ // 如果监视的是函数，则getter为其本身
        this.getter = expOrFn;
    } else { // 监视属性
        this.getter = this.parseGetter(expOrFn);
    }

    this.value = this.get();
}

Watcher.prototype = {
    // 监控值变化收到通知
    update: function(){
        this.run();
    },
    run: function(){
        let value = this.get(); // 获取最新值
        let oldValue = this.value;
        if(value !== oldValue){
            this.value = value;
            //执行Compile中绑定的回调,更新视图
            this.cb.call(this.vm, value, oldValue);
        }
    },
    addDep: function(dep){
        // 每次调用run函数的时候都会触发相应属性的getter，getter里面会触发dep.depend
        // 继而触发这里的addDep，所以如果相应属性的dep.id已经在当前Watcher的depIds里，
        // 说明不是一个新的属性，仅仅是改变了值而已，不做处理
        if(!this.depIds.hasOwnProperty(dep.id)){
            dep.addSub(this);
            this.depIds[dep.id] = dep;
        }
    },
    get: function(){
        
        Dep.target = this;
        // 如果是属性，getter方法即是下面的parseGetter方法
        let value = this.getter.call(this.vm, this.vm);
        Dep.target = null;
        return value;
    },
    parseGetter: function(exp){
        if (/[^\w.$]/.test(exp)) return; 
        let exps = exp.split('.');
        return function(obj){
            for(let i = 0, len = exps.length; i < len; i++){
                if(!obj) return;
                // 这里取值时会调用属性的get，并且Dep.target为当前的Watcher，
                // 所以可以将该Watcher加入到属性Dep容器的Subs内
                obj = obj[exps[i]];
            }
            return obj;
        }
    }
}