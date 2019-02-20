// 解析dom文档指令
function Compile(el, vm){
    this.$vm = vm;
    this.$el = this.isElementNode(el) ? el : document.querySelector(el);
    if(this.$el){
        this.$fragment = this.node2Fragment(this.$el);
        this.init();
        this.$el.appendChild(this.$fragment);
    }
}

Compile.prototype = {
    node2Fragment: function(el) {
        // 为减少回流和重绘，新建一个fragment
        let fragment = document.createDocumentFragment(), child;
        // 将原生节点拷贝到fragment
        while(child = el.firstChild){
            fragment.appendChild(child);
        }
        return fragment;
    },

    init: function(){
        this.compileElement(this.$fragment);
    },

    // 遍历所有节点及其子节点，进行扫描解析编译
    compileElement: function(el){
        let childNodes = el.childNodes, me = this;

        [].slice.call(childNodes).forEach(node => {
            let text = node.textContent;
            let reg = /\{\{(.*)\}\}/; // 表达式文本

            // 按元素节点方式编译
            if(me.isElementNode(node)){
                me.compile(node);
            } else if(me.isTextNode(node) && reg.test(text)){
                me.compileText(node, RegExp.$1);
            }

            //遍历编译子节点
            if(node.childNodes && node.childNodes.length) {
                me.compileElement(node);
            }
        });
    },

    compile: function(node){
        let nodeAttrs = node.attributes, me = this;

        [].slice.call(nodeAttrs).forEach(attr => {
            let attrName = attr.name;
            if(me.isDirective(attrName)){
                let exp = attr.value;
                let dir = attrName.substring(2); 
                // 事件指令 dir==on
                if(me.isEventDirective(dir)){
                    compileUtil.eventHandler(node, me.$vm, exp, dir);
                } else {
                    compileUtil[dir] && compileUtil[dir](node, me.$vm, exp);
                }

                node.removeAttribute(attrName);
            }
        });
    },

    compileText: function(node, exp) {
        compileUtil.text(node, this.$vm, exp);
    },

    isDirective: function(attr){
        return attr.indexOf('v-') == 0;
    },

    isEventDirective: function(dir) {
        return dir.indexOf('on') === 0;
    },

    isElementNode: function(node) {
        return node.nodeType == 1;
    },

    isTextNode: function(node) {
        return node.nodeType == 3;
    },
}

// 指令处理集合
var compileUtil = {
    bind: function(node, vm, exp, dir){
        // 获取node绑定到的数据修改时，node对应的修改属性
        let updaterFn = updater[dir + 'Updater']; 
        // 第一次初始化视图
        updaterFn && updaterFn(node, this._getVMVal(vm, exp));
        // 实例化订阅者，此操作会在对应的属性中添加该订阅者Watcher
        // 一旦属性有变化，会收到通知执行updaterFn更新函数，更新视图
        new Watcher(vm, exp, (value, oldValue) => updaterFn && updaterFn(node, value, oldValue));
    },

    text: function(node, vm, exp){
        this.bind(node, vm, exp, 'text');
    },

    html: function(node, vm, exp){
        this.bind(node, vm, exp, 'html');
    },

    model: function(node, vm, exp){
        this.bind(node, vm, exp, 'model');

        let me = this,
            val = this._getVMVal(vm, exp);
        
        node.addEventListener('input', e => {
            let newValue = e.target.value;
            if(val === newValue){
                return;
            }

            me._setVMVal(vm, exp, newValue);
            val = newValue;
        });
    },

    class: function(node, vm, exp){
        this.bind(node, vm, exp, 'class');
    },

    // 还可以继续设置绑定style 啥的 ......

    // 事件处理 将指令中的事件绑定到methods中的函数
    eventHandler: function(node, vm, exp, dir){
        let eventType = dir.split(':')[1],
            fn = vm.$options.methods && vm.$options.methods[exp];

        if(eventType && fn) {
            node.addEventListener(eventType, fn.bind(vm), false);
        }
    },

    _getVMVal: function(vm, exp){
        let val = vm;
        exp = exp.split('.');
        exp.forEach(k => val = val[k]);

        return val;
    },

    _setVMVal: function(vm, exp, value){
        let val = vm;
        exp = exp.split('.');
        exp.forEach((k, i) => {
            //非最后一个key，更新val的值
            if(i < exp.length - 1){
                val = val[k];
            } else {
                val[k] = value;
            }
        });
        //console.log(val);
    }
}

// 设定各种node需绑定的属性值
var updater = {
    textUpdater: function(node, value){
        //console.log('text cb ', value);
        node.textContent = typeof value == 'undefined' ? '' : value;
    },

    htmlUpdater: function(node, value){
        //console.log('html cb ', value);
        node.innerHTML = typeof value == 'undefined' ? '' : value;
    },

    classUpdater: function(node, value, oldValue){
        //console.log('class cb ', value);
        let className = node.className;
        className = className.replace(oldValue, '').replace(/\s$/, '');

        let space = className && String(value) ? ' ' : '';

        node.className = className + space + value;
    },

    modelUpdater: function(node, value, oldValue){
        //console.log('model cb ', value);
        node.value = typeof value == 'undefined' ? '' : value;
    }
}