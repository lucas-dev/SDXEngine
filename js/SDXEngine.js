/************************************************************
* 	Este código fue escrito hacia finales del 2013 en un 
*	intento por escapar del "yugo" de jQuery, que constituia
*	el único acercamiento a Javascript que tenia por aquel
*	entonces.
*	Esta clase corresponde a una aplicación similar a esta,
*	desarrollada en "Vanilla JS", a la que no llegué a 
*	publicarla. 
*	Como no me daba el tiempo para hacer modificaciones al
*	código, dejé todo como estaba, por lo que hay varios 
*	componentes que no se usan en el presente app pero que
*	eran parte de la versión anterior.
************************************************************/
function SDXEngine() {
	var that= this;
	var currentPage= 0;
	var searchTitle= null;
	var subsList= [];
	var searchCallback= null;
	var didFinishScraping= false;

	var endpoints= new function() {
		this.BASE_URL= "http://www.subdivx.com";
		this.getSearchURL= function() {
			return this.BASE_URL+"/index.php?accion=5&buscar="+searchTitle+"&pg="+currentPage
		};
		this.getCommentsURL= function(subId){
			return this.BASE_URL+"/popcoment.php?idsub="+subId
		};
	};

	var utils= {
		ajaxRequest: function(url, callback, errCallback) {
			console.info("Request to: "+url);
			var xmlHTTP= new XMLHttpRequest();
			xmlHTTP.onreadystatechange= function() {
				if(xmlHTTP.readyState == XMLHttpRequest.DONE) {
					if(xmlHTTP.status == 200) {
						callback(xmlHTTP.responseText);
					} else {
						didFinishScraping= true; // para detener runCallbackAfterScrapingFinished
						if(errCallback) errCallback(utils.messages.serverNotAvailable);
					}
				}
			}

			xmlHTTP.open("GET", url, true);
			xmlHTTP.send();
		},
		cacheResults: function() {
			// TODO implementar
		},
		clearCache: function() {
			// TODO implementar
		},
		parseHTML: function(html) {
			var element= document.createElement("div");
			element.innerHTML=html;
			return element;
		},
		doPowerSearchAndAddClass: function(obj, objKey, searchTerm, className, flag) {
			if(obj[objKey].toLowerCase().indexOf(searchTerm.toLowerCase())>-1) {
				obj[objKey]= utils.replaceAll(obj[objKey].toLowerCase(),searchTerm.toLowerCase(),'<span class="'+className+'">'+searchTerm+'</span>');
				flag.isMatch= true;
			}
		},
		replaceAll: function(string, find, replace) {
		  find= find.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
		  return string.replace(new RegExp(find, 'g'), replace);
		},
		// http://stackoverflow.com/a/728694
		clone: function clone(obj) {
		    var copy;

		    // Handle the 3 simple types, and null or undefined
		    if (null == obj || "object" != typeof obj) return obj;

		    // Handle Date
		    if (obj instanceof Date) {
		        copy = new Date();
		        copy.setTime(obj.getTime());
		        return copy;
		    }

		    // Handle Array
		    if (obj instanceof Array) {
		        copy = [];
		        for (var i = 0, len = obj.length; i < len; i++) {
		            copy[i] = clone(obj[i]);
		        }
		        return copy;
		    }

		    // Handle Object
		    if (obj instanceof Object) {
		        copy = {};
		        for (var attr in obj) {
		            if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
		        }
		        return copy;
		    }

		    throw new Error("Unable to copy obj! Its type isn't supported.");
		},
		objects: {
			subtitle: function() {
				return {
					title:null, 
				 	url:null, 
				 	description:null, 
				 	downloadCount:null,
				 	comments:[], 
				 	format:null,
				 	user:null, 
				 	uploadDate:null, 
				 	downloadLink:null
				}
			},
			comment: function() {
				return {
					text: null,
					user: null
				}
			},
			response: function(status, data, error) {
				return {
					status: status,
					data: data,
					error: error
				}
			},
			error: function(code, description) {
				return {
					code: code,
					description: description
				}
			}
		},
		messages: {
			serverNotAvailable: "Server is not available. Please try again later or contact lucas.abgodoy@gmail.com",
			parseDateError: function(date, msg) {return "can't parse "+date+". Message: "+msg},
			runCallbackAfterScrapingFinished: "executing runCallbackAfterScrapingFinished() until subs are processed",
			sortError: function(field) {return "can't sort subtitles by field "+field+". Invalid value. "+
				"Use [title, downloadCount,comments,format,uploadDate]"},
			arrayEmptySort: function(searchTitle) {return "can't sort subtitles because array of results is empty"+ 
				"for title \""+searchTitle+"\""},
			searchFailed: function(){return "Ha ocurrido un error en el servidor buscando subtitulos para "+endpoints.getSearchURL();},
			subsNotFound: function(){return "No se han encontrado subtitulos en la siguiente URL: "+endpoints.getSearchURL();}
		},
		shame: {
			stringToDate: function(date) {	
				var _date = null;
				try {
					var dateArray= date.split("/");
					_date= new Date(dateArray[2],dateArray[1]-1,dateArray[0]);
				} catch(e) {
					console.error(utils.messages.parseDateError(date,e.message));
				}
				return _date;
			},
			regexPatterns: {
				downloadCount: /Downloads:(.*?)?Cds:/,
				commentId: /idsub=(.*?)?"/,
				format: /Formato:(.*?)?Subido/,
				userName: /Subido por:(.*?)?\s/,
				uploadDate: /el<\/b>(.*?)?<a/,
				downloadURL: /http:\/\/www.subdivx.com\/bajar.php(.*?)(?=">)/,
				// ([^]+) es para seleccionar todo, incluso salto de lineas, ya
				// que algunos comentarios tienen salto de linea
				commentText: /<div id="pop_upcoment">([^]+)(?=<div id="pop_upcoment_der">)/,
				commentUser: /target="new">(.*?)(?=<\/a><\/div>)/
			},
			sortArray: function(obj, field, order) {
				function sort() {
					return function(a,b) {
						if(typeof obj === 'string') {
							if (order === that.constants.sort.group.ASC) {
						        return (a[field].toLowerCase() === b[field].toLowerCase() 
						        	? 0 : (a[field].toLowerCase() 
						        		< b[field].toLowerCase() ? -1 :1));
							} else {
						        return (a[field].toLowerCase() === b[field].toLowerCase() 
						        	? 0 : (a[field].toLowerCase()
						        	 < b[field].toLowerCase() ? 1 :-1));
							}
						}
						if(Object.prototype.toString.call(obj) === '[object Date]') {
							a= a[field];
							b= b[field];
						}
						if((Object.prototype.toString.call(obj) === '[object Array]')) {
							a= a[field].length;
							b= b[field].length;
						}

						if(!isNaN(parseFloat(obj)) && isFinite(obj)) {
							a= parseFloat(a[field]);
							b= parseFloat(b[field]);
						}
						
						if(order === that.constants.sort.group.DESC)
							return a - b;
						else
							return b - a;
					}
				}

				return sort();
			},
			runCallbackAfterScrapingFinished: function(callback) {
				var interval = setInterval(function () {
					if (didFinishScraping) {
						clearInterval(interval);
						callback();
					} else {
						console.debug(utils.messages.runCallbackAfterScrapingFinished);
					}
				},100);
			},
			doRiskyOperation: function(func, errorMsg) {
				try {
					return func();
				} catch (e) {
					console.error(errorMsg+"\nStacktrace: "+ e.message);
					return null;
				}
			}	
		}
	}


	this.search= function(title, successCallback, errCallback) {
		subsList = [];
		currentPage= 1;
		searchTitle= title;
		searchCallback= successCallback;
		utils.ajaxRequest(endpoints.getSearchURL(), this.doScraping, errCallback);
	}

	// see SCRAPING REFERENCE
	this.doScraping= function(response) {
		var responseNode = utils.parseHTML(response);
		// si no se encuentra la clase .result_busc, es casi seguro que hay un error
		if(!responseNode.querySelector(".result_busc")) {
			didFinishScraping= true;
			// si existe este id, es probable que solamente no se hayan encontrado subtitulos
			if(responseNode.querySelector("#detalle_ficha")) {
				searchCallback(utils.objects.response("ERR",subsList,utils.objects.error("SUBS_NOT_FOUND",utils.messages.subsNotFound())));	
			} else {
				searchCallback(utils.objects.response("ERR",subsList,utils.objects.error("SEARCH_ERROR",utils.messages.searchFailed())));
			}
		} else {
			// nodo del titulo (#menu_detalle_buscador)
			var titleNodes= responseNode.querySelectorAll("#menu_detalle_buscador > #menu_titulo_buscador > .titulo_menu_izq");
			// nodo de los detalles (#buscador_detalle)
			var detailNodes= responseNode.querySelectorAll("#buscador_detalle");

			if(titleNodes.length && detailNodes.length) {
				didFinishScraping= false;
				// se supone que titleNodes y detailNodes siempre tienen la misma longitud
				for(var i= 0;i<titleNodes.length;i++) {
					// #menu_detalle_buscador
					var titleNode= titleNodes[i];
					// #buscador_detalle
					var detailNode= detailNodes[i];
					var extraDetails= detailNode.querySelector("#buscador_detalle_sub_datos");

					// objeto subtitulo
					var subtitle = utils.objects.subtitle();

					// seteando los campos del objeto
					// starting dangerous code
					subtitle.title= titleNode.textContent;
					subtitle.url= titleNode.href;	
					subtitle.description= utils.shame.doRiskyOperation(function(){
						return detailNode.querySelector("#buscador_detalle_sub").textContent
					},"Error parsing description for subtitle "+i);
					subtitle.downloadCount= utils.shame.doRiskyOperation(function(){
						return parseFloat(extraDetails.textContent.match(utils.shame.regexPatterns.downloadCount)[1].replace(",",""))
					}, "Error parsing downloadCount for subtitle "+i);
					subtitle.format= utils.shame.doRiskyOperation(function(){
						return extraDetails.textContent.match(utils.shame.regexPatterns.format)[1]
					}, "Error parsing format for subtitle "+i);
					subtitle.user= utils.shame.doRiskyOperation(function(){
						return extraDetails.textContent.match(utils.shame.regexPatterns.userName)[1]
					}, "Error parsing userName for subtitle "+i);
					subtitle.uploadDate= utils.shame.doRiskyOperation(function(){
						return utils.shame.stringToDate(extraDetails.outerHTML.match(utils.shame.regexPatterns.uploadDate)[1])
					}, "Error parsing uploadDate for subtitle "+i);
					subtitle.downloadLink= utils.shame.doRiskyOperation(function(){
						return extraDetails.outerHTML.match(utils.shame.regexPatterns.downloadURL)[0].replace("amp;","")
					}, "Error downloadLink for subtitle "+i);
					// tratando los comentarios
					if(extraDetails.outerHTML.indexOf("idsub")>-1) {
						(function(sub){
							var commentId= utils.shame.doRiskyOperation(function(){
								return extraDetails.outerHTML.match(utils.shame.regexPatterns.commentId)[1]
							});
							utils.ajaxRequest(endpoints.getCommentsURL(commentId), function(response) {
								var responseHTML= utils.parseHTML(response);
								var commentNodes= responseHTML.querySelectorAll("#pop_upcoment");
								for(var i=0;i<commentNodes.length;i++) {
									var commentNode= commentNodes[i];
									var commentObject= new utils.objects.comment;
									commentObject.text= utils.shame.doRiskyOperation(function(){
										return commentNode.outerHTML.match(utils.shame.regexPatterns.commentText)[1]
									}, "Error parsing description for comment "+i);
									commentObject.user= utils.shame.doRiskyOperation(function(){
										return commentNode.outerHTML.match(utils.shame.regexPatterns.commentUser)[1]
									}, "Error parsing userName for comment "+i);
									
									// agregando el comentario al objeto subtitle
									sub.comments.push(commentObject);
								}
							});
						})(subtitle);
					}
					// adding subtitles to array
					subsList.push(subtitle);
				}
				// paginacion
				currentPage++;
				utils.ajaxRequest(endpoints.getSearchURL(), that.doScraping);
			} else {
				// todos los subtitulos fueron procesados
				didFinishScraping= true;
				console.log("LISTA DE SUBTITULOS");
				console.table(subsList);
			}
			subsList.didFinishScraping= didFinishScraping;
			searchCallback(utils.objects.response("OK",subsList,null));
		}
	}

	this.sortBy = function(field, order, callback) {
		// para no mutar el array original
		var sortedArray= [];
		utils.shame.runCallbackAfterScrapingFinished(function() {
			if(subsList.length) {
				// check field exists in array of allowed values
				var isValidField= false;
				for( var key in that.constants.sort.field){
					if(field === that.constants.sort.field[key]){
						isValidField= true;
						break;
					}
				}
				if(isValidField) {
					var sortFunc= utils.shame.sortArray(subsList[0][field], field, order);
					sortedArray= Array.prototype.slice.call(subsList).sort(sortFunc);
				} else {
					var msgError= utils.messages.sortError(field);
					console.error(msgError);
					callback(utils.objects.response("ERR",null,utils.objects.error("INVALID_FIELD",msgError)));
				}
			} else {
				console.error(utils.messages.arrayEmptySort);
			}
			callback(utils.objects.response("OK", sortedArray, null));
		});
	},
	this.processSubtitles= function(callback) {
		utils.shame.runCallbackAfterScrapingFinished(function(){
			callback(utils.objects.response("OK", subsList, null));
		});
	},
	this.powerSearch= function(searchTerm, className, callback) {
		utils.shame.runCallbackAfterScrapingFinished(function() {
			var arrayFilteredSubs= [];
			for(var i=0;i<subsList.length;i++) {
				// flag para saber si hubo una busqueda exitosa
				// esto es un objeto porque el valor va a ser seteado
				// en una funcion que lo va a recibir como parametro.
				// si fuera un valor primitivo, no se podria setear
				// el valor desde la funcion
				var flag= {isMatch: false};
				// haciendo una copia del subtitulo original para 
				// no modificar sus propiedades
				var subtitle= utils.clone(subsList[i]);


				utils.doPowerSearchAndAddClass(subtitle, "title", searchTerm, className, flag);
				utils.doPowerSearchAndAddClass(subtitle, "user", searchTerm, className, flag);
				utils.doPowerSearchAndAddClass(subtitle, "format", searchTerm, className, flag);
				utils.doPowerSearchAndAddClass(subtitle, "description", searchTerm, className, flag);

				if(subtitle.comments) {
					for(var j=0;j<subtitle.comments.length;j++) {
						var comment= subtitle.comments[j];
						utils.doPowerSearchAndAddClass(comment, "text", searchTerm, className, flag);
						utils.doPowerSearchAndAddClass(comment, "user", searchTerm, className, flag);
					}
				}
				if(flag.isMatch){
					arrayFilteredSubs.push(subtitle)
				};
			}
			console.log("POWER SEARCH para: "+searchTerm);
			console.log(arrayFilteredSubs);
			callback(utils.objects.response("OK",arrayFilteredSubs,null));
		});
	},
	this.constants= {
		sort: {
			field: {
				TITLE: "title", 
				DOWNLOAD_COUNT: "downloadCount", 
				COMMENTS: "comments",
				FORMAT: "format",
				UPLOAD_DATE: "uploadDate"
			},
			group: {
				ASC: "asc",
				DESC: "desc"
			}
		},
	}
	
}

function SDXException(message) {
	this.name= "SDXException";
	this.message= (message || "");
}
SDXException.prototype= new Error();


/*			SCRAPING REFERENCE			*/

/* 

Esta es una URL típica para obtener los subtitulos: 
http://www.subdivx.com/index.php?buscar=birdman&accion=5

Cada fila de resultado con los subtitulos, se compone de:
	-un div #menu_detalle_buscador que tiene info del titulo
	-un div #buscador_detalle con toda la demas info del subtitulo

Esto es lo que hay que parsear:
	<div id="menu_detalle_buscador">
	    <div id="menu_titulo_buscador">
	        <a class="titulo_menu_izq" 
	        	href="http://www.subdivx.com/X6XNDE2NzkzX-birdman-2014.html">
	        	Subtitulo de Birdman (2014)
	        </a>
	    </div>
		<img src="img/calif5.gif" class="detalle_calif" name="detalle_calif">
	</div>

	<div id="buscador_detalle">
	    <div id="buscador_detalle_sub">
	    	sirve para birdman 2014 720p brrip x264 yify</div>
	    <div id="buscador_detalle_sub_datos">
	        <b>Downloads:</b> 58,508 
	        <b>Cds:</b> 1 
	        <b>Comentarios:</b>
	        <a rel="nofollow" href="popcoment.php?idsub=NDE2Nzkz" 
	        onclick="return hs.htmlExpand(this, { objectType: 'iframe' } )">
	        	85
	        </a>
	        <b>Formato:</b> SubRip 
	        <b>Subido por:</b>
	        <a class="link1" href="http://www.subdivx.com/X9X1616837">TaMaBin</a>
	        <img src="http://www.subdivx.com/pais/7.gif" width="16" height="12">
	        <b>el</b> 04/02/2015  
	        <a rel="nofollow" target="new" href="http://www.subdivx.com/bajar.php?id=416793&amp;u=7">
	            <img src="bajar_sub.gif" border="0">
	        </a>
	    </div>
	</div>

Puede que algunos datos no vengan siempre, como la fecha de subida del subtitulo, por citar un ejemplo.

*/

