
$(function(){
	
	// CONSTANTS (ENUMS)
	var InputEventsEnum =
	{
		MOUSE: 0,
		TOUCH: 1,
	}
	
	// "PRIVATE" (INTERNAL) FIELDS
	var data = window.DISCURSOSDATA;
	var buttonsCnt = data.Botones.length;
	var buttons = [];
	var lastButton = -1;
	var pages = [];
	var lastPage = -1;
	var pagesCnt = 0;
	var inputEvent = GetInputEvent();
	var fadeTime = 350;
	
	//Agregado Tine, para bts laterales
	var currentIndex = 0;
	var currentPage = 0;
	//Final Tine

	// JQUERY WRAPPER ELEMENTS 
	var $Document = $(document);
	var $Window = $(window);
	var $AppContainer = $('#container');
	var $Header = $('#header', $AppContainer);
	var $HeaderTitle = $('#header_title', $Header);
	var $Menu = $('#menu', $AppContainer);
	var $Loader = $('#menu_loader', $Menu);
	var $MenuButtons = $('#menu_buttons', $Menu);
	var $MenuPages = $('#menu_pages', $Menu);
	var $Main = $('#main', $AppContainer);
	var $MainFrame;
	var $Footer = $('#footer', $AppContainer);
	var $FooterTitle = $('#footer_title', $Footer);
	var $Loading = $('#loading', $AppContainer);
	var $MenuPagesContainer;
	var pagesContainerWidth;
	
	//Glossary & biblio (Tine)
	var glossary = window.GLOSARIO;
	var credits = window.CREDITOS;
	var biblio = window.BIBLIO;
	
	//Debug Safari Tie
	var fctrResize = -1;

	$Loading.hide();

	// TITLES
	document.title = data.TituloPaginaWeb;
	$HeaderTitle.text(data.TituloDiscurso);
	$FooterTitle.text(data.TituloPieDePagina);
	
	// SETUP MENU BUTTONS
	var buttonsString = '';
	for(var i = 0; i < buttonsCnt; i++) buttonsString += '<div class="menu_button">' + data.Botones[i].Titulo + '</div>';
	buttonsString += '<div style="float:none;"></div>';
	$MenuButtons.empty();
	$MenuButtons.append(buttonsString);
	$MenuButtons.children().each(function(index) {
		if(index < buttonsCnt){
			var $Button = $(this);
			$Button.on(inputEvent.Start, function(e){
				e.preventDefault();
				SetButton(index);
				SetPage(index, 0);
			});
			buttons.push($Button);
		}
	});
	var menuWidth = buttons[0].outerWidth(true) * buttonsCnt;
	$MenuButtons.css({'position': 'absolute', 'left': '50%', 'width': menuWidth, 'margin-left': -((menuWidth * .5) | 0)})
	
	
	//SETUP LATERAL BUTTONS (Tine)
	$('#lb_right').on("click", function(e){
		if(data.Botones[currentIndex].Paginas.length > currentPage+1){
			SetPage(currentIndex,currentPage+1);
		} else {
			if(currentIndex+1 < data.Botones.length){
				SetButton(currentIndex+1);
				SetPage(currentIndex+1,0);
			} else {
				//Página final, stay on page
			}
		}
	});
	
	$('#lb_left').on("click", function(e){
		if(currentPage > 0){
			SetPage(currentIndex,currentPage-1);
		} else {
			if(currentIndex > 0){
				SetButton(currentIndex-1);
				SetPage(currentIndex-1,pagesCnt-1);
			} else {
				//First page, stay on page
			}
		}
		
	});
	
	// SETUP GLOSSARY (Tine)
	$('#glossary_button').on("click", function(e){
		preparePopup("Glosario");
		var tableString = '<table class="glossary_table">';
		for(var i=0;i<glossary.definiciones.length;i++){
			var trmString = '<td class="glossary_entry">' + glossary.definiciones[i].trm + '</td>';
			var defString = '<td class="glossary_definition">' + glossary.definiciones[i].def + '</td>';
			tableString += '<tr>' + trmString + defString + '</tr>';
		}
		tableString += '</table>';
		$("#popup_content").append(tableString);
		locatePopup();
	});

	
	// SETUP BIBLIO (Tine)
	$('#biblio_button').on("click", function(e){
		preparePopup("Referencias bibliográficas");
		var ulString = '<ul>';
		for(var i=0;i<biblio.length;i++){
			ulString += '<li class="glossary_definition">' + biblio[i] + '</li>';
		}
		ulString += '</ul>';
		$("#popup_content").append(ulString);
		locatePopup();
	});
	
	// SETUP CREDITS (Tine)
	$('#credits_button').on("click", function(e){
		preparePopup("Créditos de la unidad");
		var tableString = '<table class="credits_table">';
		tableString += "<thead><tr><th>UAM Cuajimalpa</th><th>LITE</th></tr></thead>";
		tableString += "<tfoot><tr><td class='credits_UAM_foot'></td><td class='credits_LITE_foot'></td></tr></tfoot>";
		tableString += '<tr>';
		for(var key in credits){
			var datos = "";
			for(var i=0;i<credits[key].length;i++){
				var rubro = "<p class='credits_rubro'>" + credits[key][i].rubro + "</p>";
				var nombres = "<p class='credits_nombres'>";
				for(var n=0;n<credits[key][i].nombres.length; n++){
					nombres+= credits[key][i].nombres[n]+'<br>';
				}
				nombres+= '</p>'
				datos += rubro + nombres;
			}
			tableString += '<td>' + datos + '<br></td>';
		}
		tableString += '</tr></table>';
		$("#popup_content").append(tableString);
		locatePopup();
	});
	
	//Button close popup
	$('.bt_close_popup').on("click", function(e){
		$('.popupWindow').removeClass('visible').addClass('oculto');
		$("#popup_content").empty();
		if($("#popup_header").text()=='Créditos de la página' && (/iphone|ipad/.test(navigator.userAgent.toLowerCase()) || !/(Chrome|Firefox|Opera|MSIE)/i.test(navigator.userAgent) )){
			reloadContainer(); // --> para evitar que se coma parte de la página en Safari o iOS
		}
	});
	
	
	function preparePopup(titulo){
		if($('.popupWindow').hasClass('oculto')){
			$('.popupWindow').removeClass('oculto').addClass('visible');
		}
		$("#popup_header").text(titulo);
		$("#popup_content").empty();
	}
	
	// CANCEL DOCUMENT TOUCH EVENT
	//$Document.on('touchmove', false);
	
	// ATTACH EVENTS TO FUNCTIONS
	$Window.on('load', Startup);
	$Window.on('unload', Finised);
	$Window.on('beforeunload', Finised);
	
	
	
	// END 
	function Finised (){
		if(!data.onLMS)
			return;
		var suspData = {
			'current' 		: {button:currentIndex,page:currentPage},
			'evaluation'	: data.eval,
			'buttons'		: $.extend(data.Botones,true),
		};		
		var lesson_status = 'incomplete';
		var exit = 'suspend';
		
		var allVisited = getIsAllVisited(); 
		console.log("Saliendo del recurso : ",allVisited,data.exerciseComplete);
		
		if(allVisited && data.exerciseComplete){
			lesson_status = 'completed';
			exit = 'logout';
		} 
		console.log("Estatus de salida : ",lesson_status, exit);
		
		doLMSSetValue('cmi.core.lesson_location', JSON.stringify(suspData.current));
		doLMSSetValue('cmi.core.lesson_status'	, lesson_status);
		doLMSSetValue('cmi.core.exit'			, exit);
		doLMSSetValue('cmi.suspend_data'		, JSON.stringify(suspData));
		doLMSFinish("");
		
		//return "Debug saliendo";
	}
	
	// STARTUP
	function Startup(){
		$AppContainer.fadeIn(fadeTime, function(){
		currentIndex = 0;
		currentPage = 0;	
			data.onLMS = doLMSInitialize("") == 'true';
			data.exerciseComplete = false;
			data.eval = {};
			console.log("LMS INIcializado : ",data.onLMS);
			getPercentComplete(true); // Init idx and pages count;
			if(data.onLMS && doLMSGetValue("cmi.core.entry") == 'resume'){
				var current = doLMSGetValue('cmi.core.lesson_location');
				if(current.length > 0 && (current = JSON.parse(current))){
					currentIndex = current.button;	
					currentPage = current.page;
					
					var suspData = doLMSGetValue('cmi.suspend_data');
					
					if(suspData.length > 0){
						suspData = JSON.parse(suspData);
					} else {
						suspData = {buttons : []};
					}
					for(var i=0;i< suspData.buttons.length;i++){
						var currBtn = suspData.buttons[i];
						for(var j = 0 ; j < currBtn.Paginas.length;j++){
							data.Botones[i].Paginas[j].visited = currBtn.Paginas[j].visited;
						}
					}
					
				}
				// cmi.core.lesson_location
				// cmi.core.lesson_status (passed,completed,failed,	incomplete, browsed,not attempted)
				// cmi.core.entry (ab-initio,"resume", '')
				// cmi.core.score.min
				// cmi.core.score.max
				// cmi.core.score.row
				// cmi.core.exit (time-out,"suspend"****,"logout")
				// cmi.suspend_data (time-out,"suspend"****,"logout")
				console.log("Vamos a checar student_name", doLMSGetValue("cmi.core.student_name"));
			} else {
				console.log('No se pudo contactar o es una sesion nuevacon el LMS');
			}
			
			checkDevice();
			if(/\?seccion=/.test(window.location.href)){
				currentIndex = window.location.href.replace(/(.+)\?seccion=/,"").substr(0,1);
				currentPage = window.location.href.replace(/(.+)\&pagina=/,"").substr(0,1);
			}
			SetButton(currentIndex);
			SetPage(currentIndex, currentPage);
			
			if(/iPhone|iPad/i.test(navigator.userAgent)){
				window.onorientationchange = function() {
					reloadContainer();
				};
			} else if(/Android/i.test(navigator.userAgent)){
				//manageZoom no se detecta en Android con navegador nativo y Chrome
				// Sí se detecta en Android/Firefox pero window.innerWidth no se reporta correctamente.
				//Por lo mismo, se suprimen los botones laterales en android para que no se encimen con el contenido y glosario/créditos se ponen a la izquierda
				$('.lateral_button').css({'width':'0px','height':'0px'});
				$('#menu_links').css({'left':'0px','right':'auto'});
			}
			
			if(!/Android/i.test(navigator.userAgent)){
				$(window).resize(function() { // --> en iPad y Android solo hay trigger de este evento al cambiar orientación del device
					manageZoom();
				});
				manageZoom();
			}
		});
	}
	
	
	// Al cambiar la orientación en iPad y iPhone, la página ya no se muestra bien. 
	function reloadContainer(){
		var href = window.location.href.replace(/\?seccion=(.+)/,"");
		href += "?seccion="+currentIndex+"&pagina="+currentPage;
		window.location =  href;		
		location.reload();
	}

	//Reubicación botones laterales en tabletas
	function checkDevice(){
		var reTablet = /Android|iPhone|iPad/i;
		if(reTablet.test(navigator.userAgent)){
			$('.lateral_button').removeClass("compu").addClass("tablet");
		}
	}

	function locatePopup(){
		/*****
		 Para que la ventana siempre se muestra debajo del header en Safari
		 ****/
		if(/iphone|ipad/.test(navigator.userAgent.toLowerCase()) && (window.orientation === 90 || window.orientation === -90)){
			$('.popupWindow').css('top', 5);
		} else if(/android/.test(navigator.userAgent.toLowerCase()) && screen.height <= 800){
			$('.popupWindow').css('top', 0);
		} else {
			$('.popupWindow').css('top',$('#main').css('top'));
		}
	}

	// SET CONTENT 
	function SetButton(index){
		if(lastButton === index) return;
		lastButton = index;
		for(var i = 0; i < buttonsCnt; i++) buttons[i].removeClass('menu_button_selected');
		buttons[index].addClass('menu_button_selected');
		// SET PAGES
		lastPage = -1;
		pages = [];
		$MenuPages.empty();
		pagesCnt = data.Botones[index].Paginas.length;
		if(pagesCnt > 1){	
			var pagesString = '<div id="menu_pages_container">';
			for(var i = 0; i < pagesCnt; i++) pagesString += '<div class="menu_pages_page">' + (i + 1) + '</div>';
			pagesString += '<div style="float:none;"></div></div>'
			$MenuPages.append(pagesString);
			$MenuPagesContainer = $('#menu_pages_container', $MenuPages);
			$MenuPagesContainer.children().each(function(i) {
				if(i < pagesCnt){
					var $Page = $(this);
					$Page.on(inputEvent.Start, function(e){
						e.preventDefault();
						SetPage(index, i);
					});
					pages.push($Page);
				}
			});
			pagesContainerWidth = pages[0].outerWidth(true) * pagesCnt;
			$MenuPagesContainer.css({'position': 'absolute', 'left': '50%', 'width': pagesContainerWidth, 'margin-left': -((pagesContainerWidth * .5) | 0)});		
		}
	}
	
	// SET PAGE
	function SetPage(index, page){
		
		//Quitar popup en caso de que esté abierto
		if($('.popupWindow').hasClass('visible')){
			$('.popupWindow').removeClass('visible').addClass('oculto');
			$("#popup_content").empty();
		}
		
		var resized = false;
		
		currentIndex = index;
		currentPage = page;
		
		if(lastPage === page) return;
		lastPage = page;
		if(pagesCnt > 1){
			for(var i = 0; i < pagesCnt; i++) pages[i].removeClass('menu_pages_page_selected');
			pages[page].addClass('menu_pages_page_selected');
		}
		$Loading.show();
		$Main.css({'visibility':'hidden'});			
		if($MainFrame) $MainFrame.removeAttr('src'); // IE 10 IFRAME CLEAR PLUGINS HACK
		$MainFrame = null;
		$Main.empty();
		$Main.scrollTop();
		var mainFrame = '<iframe id="main_frame" frameborder="0" seamless="seamless" scrolling="auto" style="position:absolute;width:100%;height:100%"></iframe>';
		$Main.append(mainFrame);
		$MainFrame = $('#main_frame', $Main);
		$MainFrame.load(function(){
			
			$Main.css({'visibility':'visible'});
			$Loading.hide();
			
			/*********
			 *Tine: Parche para forzar $main a hacer un resize de 1px para que se active bien el scroll en Safari.
			 ********/
			if(!/(Chrome|Firefox|Opera|MSIE)/i.test(navigator.userAgent)){
				$Main.on( "custom", function( event) {
					if(!resized){
						resized=true;
						var h = $Main.height();
						$Main.height(h-fctrResize);
						fctrResize = -fctrResize;
					}
				});
				$Main.trigger( "custom", [] );
			}
			var pageObj = data.Botones[index].Paginas[page];
			pageObj.visited = true;
		});		
		$MainFrame.attr('src', data.Botones[index].Paginas[page].URL);
		
		//Agregado Tine
		if(index == data.Botones.length-1 && page == data.Botones[index].Paginas.length-1){
			$('#lb_right').addClass('off');
		} else if($('#lb_right').hasClass('off')){
			$('#lb_right').removeClass('off');
		}
		
		if(index == 0 && page == 0){
			$('#lb_left').addClass('off');
		} else if($('#lb_left').hasClass('off')){
			$('#lb_left').removeClass('off');
		}
		//Final agregado Tine
	}
	
	// GET INPUT EVENT SUPPORTED
	function GetInputEvent()
	{
		var Event = {}
		if ('ontouchstart' in window){
			Event.Type = InputEventsEnum.TOUCH;
			Event.Start = "touchstart";
			Event.Move = "touchmove";
			Event.End = "touchend";
		}else{
			Event.Type = InputEventsEnum.MOUSE;
			Event.Start = "mousedown";
			Event.Move = "mousemove";
			Event.End = "mouseup";		
		}
		return Event;
	}
	
	// END OF FILE



	/**
	*/
	function getIsAllVisited(){
		for(var i = 0 ; i<data.Botones.length; i++){
			var currBtn = data.Botones[i];
			for(var j = 0 ; j < currBtn.Paginas.length;j++ ){
				var currPage = currBtn.Paginas[j];
				if(!(currPage.hasOwnProperty('visited') && currPage.visited))
					return false;
			}
		}
		return true;
	}

	/**
	*/
	function getPercentComplete(isInit){
		var total = 0;
		var nVisited = 0;
		for(var i = 0 ; i<data.Botones.length; i++){
			var currBtn = data.Botones[i];
			for(var j = 0 ; j < currBtn.Paginas.length;j++ ){
				var currPage = currBtn.Paginas[j];
				if(isInit){
					currPage.idx = total; 
				}
				
				total++;
				if(!(currPage.hasOwnProperty('visited') && currPage.visited))
					nVisited++;
			}
		}
		if(isInit)
			data.pagesCont = total;
		if(nVisited > 0){
			var per = nVisited/total;
			per = Math.round(per * 100) / 100;
			return per;
		}
		return 0;
	}
	// END OF FILE
	
	
	
	/**
	 * 
	 */
	window.setLMSScore = function (idxExercise,nExercises, answerRight,trials){
		data.exerciseComplete = data.exerciseComplete || (idxExercise >= (nExercises-1));
		console.log(" ["+data.onLMS+"] Se llamo para actualizar el score",idxExercise,nExercises, answerRight,trials);
		console.log(" Ejercicio completo : ",data.exerciseComplete);
		
		if(!data.onLMS)
			return;
		
		if(idxExercise <=0 )
			data.eval = {};
		
		answerRight = answerRight == 1 || answerRight == '1' || answerRight == true || answerRight == 'true';
		
		data.eval['pregunta_'+idxExercise] = {trials : trials, correct : answerRight };
		
		var rightAnswersCount = 0;
		for(var i = 0 ; i < nExercises; i++){
			var idP = 'pregunta_'+i;
			if(!data.eval.hasOwnProperty(idP))
				continue;
			var dEval = data.eval['pregunta_'+i];
			if(dEval.correct)
				rightAnswersCount++;
		}
		
		var percentage = Math.floor(100*rightAnswersCount/nExercises);
		doLMSSetValue('cmi.core.score.min', 0);
		doLMSSetValue('cmi.core.score.max', 100);
		doLMSSetValue('cmi.core.score.raw', percentage);
		
		console.log("Datos del score",0,nExercises, percentage);
	}; 
});
