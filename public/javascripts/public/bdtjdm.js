//在head标签中bswz赋值下面（注意一定放在部署位置下面引入！！！）
// <script th:inline="javascript">
// 	var bswz=[[${application.bswz}]];
// </script>
// <script th:src="@{/www/public/js/public/bdtjdm.js}"></script>
var _hmt = _hmt || [];
(function() {
	if (bswz == "3") {
		var hm = document.createElement("script");
		hm.src = "../../../../../hm.baidu.com/hm.js-762a6cd324472973aa9934517a8ecb5a"/*tpa=https://hm.baidu.com/hm.js?762a6cd324472973aa9934517a8ecb5a*/;
		var s = document.getElementsByTagName("script")[0];
		s.parentNode.insertBefore(hm, s);
    }
	if (bswz == "3") {
        !function (e, t, n, g, i) {
            e[i] = e[i] || function () {
                (e[i].q = e[i].q || []).push(arguments)
            }, n = t.createElement("script"), tag = t.getElementsByTagName("script")[0], n.async = 1, n.src = ('https:' == document.location.protocol ? 'https://' : 'http://') + g, tag.parentNode.insertBefore(n, tag)
        }(window, document, "script", "assets.growingio.com/2.1/gio.js"/*tpa=http://www.chineselaw.com/www/public/js/public/assets.growingio.com/2.1/gio.js*/, "gio");
        gio('init', '832b65845596735e', {});
        gio('send');
    }
})();