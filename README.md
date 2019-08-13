# form-jquery
基于jquery 的form表单自动验证


 **1**、
 * 构造方式
 * form表单自动验证  : var obj = new MForm(option)
 * option ： {changeCb ：function,form : string(表单标识)}
 * obj可调用方法 ： {
 * validate : function(cb){} cb ：function(isvalidate，errorList){},
 * modelAction ： function(string|obj,value|isCheckRule),isCheckRule}
 * 
 **2**、
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
 **3**、
 * rules实例 ： character[
 * {required : true,trigger : "blur"，message ： "不能为空"，errorClass ： "error",cb : function},
 * {rule : //g : regExp,trigger : "blur"，message ： "不能为空"，errorClass ： "error",cb : function}
 * ]
