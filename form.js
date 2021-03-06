
/**
 * 1、
 * 构造方式
 * form表单自动验证  : var obj = new MForm(option)
 * option ： {changeCb ：function,form : string(表单标识)}
 * obj可调用方法 ： {
 * validate : function(cb){} cb ：function(isvalidate，errorList){},
 * modelAction ： function(string|obj,value|isCheckRule),isCheckRule}
 * 
 * 2、
 * 表单元素：
 * form ： 
 * data-models ： 表单绑定数据，必须为对象（双向，eval执行）
 * data-rules ： 表单验证规则，必须为对象
 * formItem ：
 * data-model ： 绑定的model数据 
 * data-rule ： 验证规则，多个规则用,隔开
 * data-html-[modelName] : 用来动态显示model的元素
 * data-for : 双向绑定的数据元素，默认为当前data-model绑定的元素
 * data-rule-trigger-for ： 表单验证触发的元素（针对利用第三方控件来实现select等效果的兼容处理，默认为 data-for所指向的元素）,多个元素用,隔开
 * data-error-class-for ：验证失败时候绑定的class元素，默认为当前data-mode所指向的元素
 * data-emit-event : 双向绑定触发事件、默认为change事件，可追加
 * 
 * 3、
 * rules实例 ： character[
 * {required : true,trigger : "blur"，message ： "不能为空"，errorClass ： "error",cb : function},
 * {rule : //g : regExp,trigger : "blur"，message ： "不能为空"，errorClass ： "error",cb : function}
 * {rule : function : function(value){return  boolean},trigger : "blur"，message ： "不能为空"，errorClass ： "error",cb : function}
 * ]
 * 
 */ 
var MForm = function (param) {
    this._init(param);
}
/**
 * _init
 */
MForm.prototype = {
    // 初始化
    _init: function (param) {
        param = param || {};
        
        this.$form = $(param.form);
        if(this.$form.length){
            this._initStaticData(param)
            ._generateItemRuleAndModel()
            ._setItemEvent()
            ._refreshView();
        }
    },
    /**
     * @property
     * 初始化静态数据
     * @param {} param 
     */
    _initStaticData: function (param) {
        this.$changeCb = param.changeCb

        var $data = this.$form.data()
        // 数据模型（地址指向）
        this.models = param.models || eval($data.models)
        // 验证规则（地址指向）
        this.rules = param.rules || eval($data.rules)

        return this;
    },
    /**
     * @private
     * 重组
     */
    _generateItemRuleAndModel: function () {
        var list = this.$form.find("[data-model]"),
            formItemObj = {},
            _this = this;

        list.each(function (i, ele) {
            var item = $(ele),
                itemData = item.data();
            var modelName = itemData["model"];
            var modelFor = itemData.for ? item.find(itemData.for) : item
            var ruleTriggerFor = itemData.ruleTriggerFor ? item.find(itemData.ruleTriggerFor) : modelFor


            formItemObj[modelName] = {
                ele: item,
                modelFor: modelFor,
                ruleTriggerFor: ruleTriggerFor,
                dHtml: _this.$form.find("[data-html=" + modelName + "]"),
                emitEvent: itemData.emitEvent || "",
                errorClassFor: itemData.errorClassFor ? item.find(itemData.errorClassFor) : item,
                modelName: itemData["model"]
            }

            var formItem = formItemObj[modelName]


            formItem.modelEleTagName = formItem.modelFor[0].tagName.toLocaleLowerCase();
            formItem.isModel = /^input|select|textarea$/g.test(formItem.modelEleTagName)


            var ruleList = []
            if (itemData.rule) {
                var ruleSplit = itemData.rule.split(",")

                for (var i = 0; i < ruleSplit.length; i++) {
                    _this.rules[ruleSplit[i]] && ruleList.push(_this.rules[ruleSplit[i]])
                }
            }

            formItem.rule = ruleList

        })

        this.formItemObj = formItemObj;

        return this;
    },
    /**
     * 初始化规则验证和数据双向绑定时间
     */
    _setItemEvent: function () {
        var _this = this;
        for (var key in this.formItemObj) {
            var item = this.formItemObj[key]

            if (item.isModel) {
                ! function (item, key) {
                    item.modelFor.on("change " + item.emitEvent, function (e) {

                        if(e.target.type == "checkbox"){
                            // var checkValue = e.target.value,uncheckValue = "";
                            // if(!checkValue){
                            var  checkValue = true;uncheckValue = false
                            // }

                            _this.models[key] = e.target.checked?checkValue:uncheckValue;
                        }
                        else{
                            _this.models[key] = e.target.value;
                        }
                        // _this._refreshView({modelList : [key],isCheckRule : false});

                        _this._renderExtraHtml(item.dHtml, _this.models[key]);
                        _this.$changeCb && _this.$changeCb([key])
                    })

                    for (var i = 0; i < item.rule.length; i++) {
                        for (var j = 0; j < item.rule[i].length; j++) {
                            var items = item.rule[i][j];

                            var eventType = items.trigger || "blur"

                            var eventTypeList = eventType.replace(/\s+/g, "|").split("|")

                            for (var j = 0; j < eventTypeList.length; j++) {
                                var prefix = eventTypeList[j] + '_event';

                                if (!item.ruleTriggerFor[prefix]) {
                                    item.ruleTriggerFor[prefix] = true;
                                } else {
                                    continue;
                                }

                                item.ruleTriggerFor.on(eventTypeList[j], function (e) {
                                    _this._checkRules([key]);
                                })
                            }
                        }
                    }

                }(item, key)
            }
        }

        return this;
    },
    /**
     * @public
     * 渲染model数据至页面 {modelKeyList-modelKey列表，默认为全部，isCheckRule-是否检查验证规则 默认不检查}
     * @param {modelKeyList : [kei] = [allKeys]，isCheckRule: boolean = false} param 
     */
    _refreshView: function (param) {
        param = param || {}

        var modelList = param.modelList || Object.keys(this.formItemObj);

        this._renderView(modelList)
        if (param.isCheckRule) {
            this._checkRules(modelList)
        }

        return this;
    },
    /**
     * 渲染页面 默认为空 不渲染任何model数据
     * @private
     * @param {modelKeyList : [key...]} param 
     */
    _renderView: function (param) {
        param = param || []
        var _this = this;

        $(param).each(function (i, ele) {
            var item = _this.formItemObj[ele]
            if (!item) return;

            if (item.isModel){
                if(item.modelFor.attr("type") == "checkbox"){
                    item.modelFor.filter('[type=checkbox]').prop("checked",!!_this.models[ele])
                }else{
                    item.modelFor.val(_this.models[ele])
                }
            }
            _this._renderExtraHtml(item.dHtml, _this.models[ele]);
        })

    },
    // 渲染额外的展示数据
    _renderExtraHtml: function (renderHtml, val) {
        if (renderHtml && renderHtml.length) {
            renderHtml.text(val);
        }
    },
    /**
     * @private
     * 检查验证规则 默认为验证全部
     * @param [modelkey1,modelkey2...] 
     */
    _checkRules: function (param) {
        var _this = this,
            errorList = [];
        param = param || Object.keys(this.formItemObj);

        $(param).each(function (index, key) {
            var item = _this.formItemObj[key],
                value = _this.models[key],
                findInvalid = false;
            for (var j = 0; j < item.rule.length; j++) {
                var ruleListItem = item.rule[j]

                for (var i = 0; i < ruleListItem.length; i++) {
                    var ruleItem = ruleListItem[i],
                        validate = true;
                    if ((ruleItem.required && !value) || (ruleItem.rule instanceof RegExp && !ruleItem.rule.test(value)) || (ruleItem.rule instanceof Function && !ruleItem.rule(value))) {
                        // 只添加一条
                        if (!findInvalid) {
                            var errorItem = $.extend({}, item, {
                                rule: ruleItem
                            })
                            errorList.push(errorItem)
                        }

                        ruleItem.errorClass && item.errorClassFor.addClass(ruleItem.errorClass)
                        validate = false;
                        findInvalid = true;
                        // break;
                    } else {
                        ruleItem.errorClass && item.errorClassFor.removeClass(ruleItem.errorClass)
                    }

                    if (ruleItem.rule instanceof RegExp) ruleItem.rule.lastIndex = 0;

                    if (ruleItem.cb) {

                        var cbParam = {
                            validate: validate,
                            value: value,
                            rule: ruleItem
                        }

                        var _param = $.extend({}, item, cbParam)

                        ruleItem.cb(_param);
                    }

                    if (!validate) break;
                }

                if (findInvalid) break;
            }
        })

        return errorList
    },
    /***
     * @public
     *  构造model的操作
     *  参数类型情况
     * [key : string] 获取值的key
     * [obj : json,isCheckRule : boolean = false] obj为键值对的形式，用来存数据，isCheckRule为是否验证表单规则
     * [key : string,value : any,isCheckRule : boolean = false]key键 value值 boolean布尔值
     */
    modelAction: function () {
        var _argus = arguments,_this = this;
        if (_argus.length) {
            if (_argus[0] instanceof Object) {
                var isCheckRule = _argus[1]
                var modelList = []
                for (var key in _argus[0]) {
                    _this.models[key] = _argus[0][key]
                    modelList.push(key)
                }

                this._refreshView({
                    isCheckRule: isCheckRule,
                    modelList: modelList
                });
                _this.$changeCb && _this.$changeCb(modelList)
            } else if (typeof _argus[0] == 'string') {
                if (_argus.length >= 2) {
                    _this.models[_argus[0]] = _this.models[_argus[1]]
                    var isCheckRule = _argus[2]
                    this._refreshView({
                        isCheckRule: isCheckRule,
                        modelList: [_argus[0]]
                    });
                    _this.$changeCb && _this.$changeCb([_argus[0]])
                } else {
                    return _this.models[_argus[0]]
                }
            } else {
                return null
            }
        } else {
            return null;
        }
    },
    /**
     * @public
     * 表单验证
     * @param {function (isvalidate,{errorList})} cb 
     */
    validate: function (cb) {
        var errorList = this._checkRules(),
            isvalidate = !errorList.length
        cb && cb(isvalidate, {
            errorList: errorList
        })
    }
}
