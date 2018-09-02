function pagination(config){
	/*var config={
			total_page:"",//总页数
			cur_page:"",//当前页
			page_size:"",//每页显示的个数
			jump:"",//是否支持输入跳转
			elem:"",//容器
			callback:"",//回调
			total_num:"",//总条数
	}*/
    var html = [];
    var max_page=10;
    if(config.total_page){
    	max_page=config.total_page;
    }else{
    	max_page = Math.ceil(config.total_num / config.page_size);
    }
    if(max_page === 1){
    	
    	config.elem.off().empty();
    	return;
    }
    var half_page = parseInt(max_page / 2);
    config.elem.off().empty().html(render_pagination()).on('click', '[data-page]', page_change).on('click', '[data-jump]', page_input_change);
    function render_pagination(){
        var html=[];
        html.push('<div class="pagination">');
        var half_page = parseInt(max_page / 2);
    	if ( config.cur_page> 1) {
            html.push('<a href="javascript:void(0)" data-page="' + (config.cur_page - 1) + '">上一页</a>');
        };
        if (max_page < 11) {
            for (var i = 1; i <= max_page; i++) {
                html.push('<a href="javascript:void(0)" data-page="' + i + '" class="change_page_btn ' + cur_page_class(i) + '">' + i + '</a>');
            };
        } else {
            html.push('<a href="javascript:void(0)" data-page="1" class="change_page_btn ' + cur_page_class(1) + '">1</a>');

            if (config.cur_page < 4 && config.cur_page < half_page) {
                for (var i = 2; i < 5; i++) {
                    html.push('<a href="javascript:void(0)" data-page="' + i + '" class="change_page_btn ' + cur_page_class(i) + '">' + i + '</a>');
                };

                html.push('<span>…</span>');
            } else if (config.cur_page >= (max_page - 3) && config.cur_page > half_page) {
                html.push('<span>…</span>');

                for (var i = ((max_page - 6) === 2 ? 3 : (max_page - 4)); i < max_page; i++) {
                    html.push('<a href="javascript:void(0)" data-page="' + i + '" class="change_page_btn ' + cur_page_class(i) + '">' + i + '</a>');
                };
            }
            
           /* else if(config.cur_page>=max_page-3){
            	html.push('<span>…</span>');
            	for (var i = (max_page - 11); i <max_page; i++) {
                    html.push('<a href="javascript:void(0)" data-page="'+ i +'" class="change_page_btn ' + cur_page_class(i) + '">' + i + '</a>');
                };
            }*/else {
                html.push('<span>…</span>');

                for (var i = (config.cur_page - 2); i < (config.cur_page + 2); i++) {
                    html.push('<a href="javascript:void(0)" data-page="'+ i +'" class="change_page_btn ' + cur_page_class(i) + '">' + i + '</a>');
                };

                html.push('<span>…</span>');
            };
            html.push('<a href="javascript:void(0)" data-page="' + max_page + '" class="change_page_btn ' + cur_page_class(max_page) + '">' + max_page + '</a>');
        };

        if (config.cur_page < max_page) {
            html.push('<a href="javascript:void(0)" data-page="' + (config.cur_page + 1) + '">下一页</a>');
        };
       /*
        html.push('<span>共'+max_page+'页</span>');*/
        if(config.jump){
            html.push('<span>前往</span><input name="page" type="text" class="form-items" /><span>页</span><a data-jump href="javascript:void(0)" class="pagination-button">确定</a>');
        }
        
        html.push('</div>');

        return html.join('');
    }
    function page_change(){

    	if($(this).hasClass("cur"))return;
        var target_page = parseInt($(this).data('page'));
        config.callback(target_page);
    }
    function cur_page_class(page) {
        if (page === config.cur_page) {
            return 'cur';
        } else {
            return '';
        };
    };
    function page_input_change(){
    	if (!$.isNumeric($(this).siblings('[name=page]').val())) {
    		$(this).siblings('[name=page]').val('');
            return;
        };
        var target_page = parseInt($(this).siblings('[name=page]').val());
        if (target_page > 0 && target_page <= max_page && target_page !== config.cur_page) {
            config.callback(target_page);
        } else {
        	$(this).siblings('[name=page]').val('')
        	//utils.operation_hints({ status: 'warn', text: '填写页数不能小于1，且不能大于最大页数 ！' })
        };
    }


}