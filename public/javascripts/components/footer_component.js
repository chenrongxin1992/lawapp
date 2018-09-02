var layout_footer=$("#layout_footer");

footer_init();
function footer_init(){
	var client_height=parseInt(document.documentElement.clientHeight||document.body.clientHeight);
	var header_height=parseInt(layout_header.height());
	var footer_height=parseInt(layout_footer.height())
	var min_height = client_height-header_height-footer_height > 400 ? client_height-header_height-footer_height : 400;
	
	$(".layout_body").css("min-height",min_height);
}
