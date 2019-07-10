
setTimeout(function(){
        $vborders = $("div").filter(function(){
 			 var $this = $(this);
  			return ($this.css("width") == "3px");
		});
        $hborders = $("div").filter(function(){
 			 var $this = $(this);
  			return ($this.css("height") == "3px");
		});

	alert("count:"+$vborders.length);
        $vborders.css("width","1px");
        $vborders.css("background-color","red");
        $hborders.css("height","1px");
        $hborders.css("background-color","red");
},10000);