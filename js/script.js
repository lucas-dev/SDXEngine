$(document).ready(function() {
	var sdxEngine = new SDXEngine();
	var subtitles = new Array();
	var highlightedString = "";
	var btnSearch = $('.ld__content__search__field__button');
	var inputSearch = $('.ld__content__search__field > input');
	var messageBox = $('.ld__content__result__message');
	var tableContainer = $('.ld__content__result__table');
	var activityIndicator = $('.progress');
	var btnAbout = $('.ld__content__title__icon');
    var table = null;

	var setUp = {
		initial: function() {
			UX.showActivityIndicator(false);
			UI.introDialog();
		},
		table: function() {
			table = $('#sdxTable').DataTable({
		        aaSorting: [],
		        language: {
		            "lengthMenu": "Mostrar _MENU_ resultados por p&aacute;gina",
		            "zeroRecords": "Sin resultados",
		            "info": "_PAGE_ de _PAGES_",
		            "infoEmpty": "No hay resultados para mostrar",
		            "infoFiltered": "(filtrados _MAX_ resultados)",
		            "search":         "Buscar en los resultados:",
		            "paginate": {
		                "first":      "Primero",
		                "last":       "&Uacute;ltimo",
		                "next":       "Siguiente",
		                "previous":   "Anterior"
		            }
		        },
		        columnDefs: [
		        	{
		            	targets: [8],
		            	visible: false
		        	}
		        ],
		        scrollY: '48vh',
				scrollCollapse: true
		    });


		    table.on('search.dt', function () {
		    	highlightedString = $('.dataTables_filter input').val();
		    	if (!highlightedString) highlightedString = inputSearch.val();
		    	UX.highlight(highlightedString);
			})
			.on('page.dt',  function () { 
		    	UX.highlight(highlightedString);
			});
		},
		dialogContainer: function() {
			$(document).on('click', '.dialog-container', function(evt) {
				$('.dialog-container').remove();
			});

			$(document).keyup(function(e) {
			    if (e.keyCode == 27) { 
			    	$('.dialog-container').remove();
			    }
			});
		},
		dialogAbout: function() {
			btnAbout.click(function() {
				UI.infoDialog();
			});

			$(document).on('click', '.dialog', function(evt) {
				evt.stopPropagation();
			});

			$(document).on('click', '.dialog__footer__close', function(evt) {
				$('.dialog-container').remove();
			});
		},
		dialogComment: function() {
			$(document).on('click', '.ld__comment', function(evt) {
				evt.stopPropagation();
			});

			$(document).on('click', '.ld__comment__footer__close', function(evt) {
				$('.dialog-container').remove();
			});
		},
		search: function() {
			btnSearch.on('click', function() {
		    	UX.enableSearch(false);
		    	UX.setInfoBox();
				highlightedString = inputSearch.val();
				UX.setMessageBox("Buscando subtitulos para \""+inputSearch.val()+"\"");
				UX.showActivityIndicator(true);
				if(inputSearch.val() && inputSearch.val().length > 3) {
					sdxEngine.search(inputSearch.val(), function(response) {
						if(response.data && response.data.length) {
							UX.enableTable();
							UX.populateTable(response.data);
							UX.setInfoBox("Cargados "+response.data.length +" subtitulos para \""+inputSearch.val()+"\"");
							if(response.data.didFinishScraping) {
								UX.showActivityIndicator(false);
								UX.enableSearch(true);
							}
						} else if(response.error) {
							UX.showActivityIndicator(false);
							UX.enableSearch(true);
							if(response.error.code === "SUBS_NOT_FOUND") {
								UX.setMessageBox(response.error.description);
							} else {
								UX.setMessageBox(response.error.description);
							}
						}
					}, function(responseText) {
						UX.showActivityIndicator(false);
						UX.enableSearch(true);
						UX.setMessageBox(responseText, "error");
					});
				} else {
					UX.showActivityIndicator(false);
					UX.enableSearch(true);
					UX.setMessageBox("Ingrese un termino de b&uacute;squeda mayor a 3 caracteres");
				}
		    });		

			inputSearch.keypress(function (e) {
				var key = e.which;
			 	if(key == 13) {
			    	btnSearch.click();
			    	return false;
			  	}
			});
		},
		clickListeners: function() {
			$('#sdxTable tbody').on('click', 'tr > td:nth-child(4)', function() {
				var rowIndex = table.row(this).index();
				UI.commentsDialog(subtitles[rowIndex].comments);
			});

			$('#sdxTable tbody').on('click', 'tr > td:nth-child(8)', function() {
				var rowIndex = table.row(this).index();
				utils.downloadLink(subtitles[rowIndex].downloadLink);
			});

			$('#sdxTable tbody').on('click', 'tr > td:nth-child(2)', function() {
				var rowIndex = table.row(this).index();
				utils.downloadLink(subtitles[rowIndex].url);
			});
		}

	}

	var UI = {
		introDialog: function() {
			$('body').append('<div class="dialog-container">\
					<div class="dialog">\
						<div class="dialog__content">\
							<h1>IMPORTANTE</h1>\
							<p>Este app mejora mil veces el buscador de subdivx.com, pero hay que usarlo correctamente.</p>\
							<p><b>PRIMERO</b> se busca por el título de la película o serie, <b>DESPUÉS</b> por la versión específica.</p>\
							<p>Por ejemplo, si necesitamos subtítulos para la película <b>Forrest Gump</b>, especificamente, para una versión\
							con calidad <b><i>1080p</i></b> y distribuida por <b><i>YIFY</i></b>, seguimos estrictamente los siguientes pasos:</p>\
							<ul><li>En el buscador principal, ponemos <b>solamente el título de la película</b>: Forrest Gump. No "Forrest Gump 1080p",\ ni "Forrest Gump YIFY"</li><li>Apretamos Enter y esperamos a que se carguen todos los resultados.</li><li>Si hay resultados,\ en el <b>sub-buscador que aparece en la tabla</b>, podemos refinar la búsqueda de a <b>un término a la vez</b>.<br>Ponemos "1080" o\ "YIFY", y se filtrarán los resultados de acuerdo a la palabra clave elegida.</li>\
							<p>El añadido más importante del app es el sub-buscador de la tabla, ya que desde el mismo podemos buscar dentro de los\ comentarios, título y descripción de cada subtítulo; pero hay que usarlo adecuadamente.</p>\
							<p>Para reportar errores del app, escribir a: <a href="mailto:lucas.abgodoy@gmail.com">lucas.abgodoy@gmail.com</a></p>\
						</div>\
						<div class="dialog__footer">\
							<div class="dialog__footer__close">Cerrar</div>\
						</div>\
					</div>\
				</div>');
		},
		infoDialog: function() {
			$('body').append('<div class="dialog-container">\
					<div class="dialog">\
						<div class="dialog__content">\
							<h2 class="dialog__content__title">Acerca de...</h2>\
							<p>Este app surge para mejorar la b&uacute;squeda de subt&iacute;tulos en\
							<a href="http://www.subdivx.com" target="_blank">subdivx.com</a>,\
							la comunidad de subt&iacute;tulos en español m&aacute;s extensa.</p>\
							<p>Para el t&eacute;rmino de b&uacute;squeda ingresado, se cargan todos los resultados de una sola vez,\
							suprimiendo la ineficiencia introducida por una potencial y extensa paginaci&oacute;n manual del sitio tradicional.</p>\
							<p>Una vez cargados todos los resultados, es recomendable filtrarlos en base a criterios m&aacute;s\
							precisos, mediante el <b>sub-buscador</b> incluido en la tabla.</p>\
							<p>Si el t&eacute;rmino de b&uacute;squeda no aparece resaltado en las filas de la tabla, lo har&aacute; en los comentarios.</p>\
							<p>Subdivx.com es una plataforma con un alto tr&aacute;fico de usuarios, lo cual impacta negativamente en\
							la estabilidad del sitio; pudiendo verse esto reflejado en el rendimiento de la presente aplicaci&oacute;n.</p>\
						</div>\
						<div class="dialog__footer">\
							<div class="dialog__footer__close">Cerrar</div>\
						</div>\
					</div>\
				</div>');
		},
		commentsDialog: function(comments) {
			if (comments.length) {
				var html = '<div class="dialog-container">\
					<div class="ld__comment">\
							<div class="ld__comment__title">'+comments.length+' comentarios</div>\
							<div class="ld__comment__content">';
								
							for (var i=0; i<comments.length; i++) {
								html+= '<div class="ld__comment__content__row">\
											<div class="ld__comment__content__row__user">'+comments[i].user+'</div>\
											<div class="ld__comment__content__row__text">'+comments[i].text+'</div>\
										</div>';
							}

							html+='</div>\
							<div class="ld__comment__footer">\
								<div class="ld__comment__footer__close">Cerrar</div>\
							</div>\
						</div>\
					</div>';

					html = $(html);

					$('body').append(html);

					html.highlight(highlightedString);
			}
		}

	}

	var UX = {
		setMessageBox: function(message) {
			messageBox.show();
			messageBox.html(message);
			tableContainer.hide();
		},
		enableTable: function() {
			messageBox.hide();
			tableContainer.show();
		},
		showActivityIndicator: function(show) {
			if (show)
				activityIndicator.show();
			else
				activityIndicator.hide();
		},
		populateTable: function(subsList) {
			table.search(''); // para limpiar el filtro de búsqueda de la tabla
			table.clear().draw();
			var array = new Array();
			subtitles = new Array();
			for(var i=0;i<subsList.length;i++) {
				var subtitle= subsList[i];
				subtitles.push(subtitle);
				array.push([
					subtitle.title, 
				 	subtitle.url, 
				 	subtitle.description, 
				 	subtitle.comments?subtitle.comments.length:0,
				 	subtitle.format,
				 	subtitle.user,
				 	utils.dateCell(subtitle.uploadDate),
				 	subtitle.downloadLink,
				 	JSON.stringify(subtitle.comments)
				]);
			}
			table.rows.add(array).draw();
			tableContainer.highlight(inputSearch.val());
		},
		highlight: function(string) {
			tableContainer.removeHighlight();
			setTimeout(function() {
				tableContainer.highlight(string);
			}, 150);
		},
		setInfoBox: function(message) {
			if (!message)
				$(".ld__content__info > span").css("visibility","hidden");
			else
				$(".ld__content__info > span").css("visibility","visible");
				$(".ld__content__info > span").text(message);
		},
		enableSearch: function(shouldEnable) {
			var color = "#0287d2";
			var disabled = false;
			if (!shouldEnable) {
				color = "#D3D3D1";
				disabled = true;
			}

			$('.ld__content__search__field').prop('disabled', disabled);
			$('.ld__content__search__field__button').css('background-color',color);

		}
	}

	var utils = {
		// el span .hidden-date es parte de un hack que contiene la fecha en formato YYYYMMDD, para posibiliar el ordenamiento
		dateCell: function(date) {
			if (date) 
				return ("<span class='hidden-date'>"+utils.dateToYYYYMMDD(date)+"</span>") + utils.dateString(date);
			return "";
		},
		dateToYYYYMMDD: function(date) {
			return date.getFullYear()+""+(date.getMonth())+""+(date.getDate());
		},
		dateString: function(date) {
			return date.getDate()+"/"+(date.getMonth()+1)+"/"+date.getFullYear();
		},
		downloadLink: function(url) {
			window.open(url);
		}

	}


	setUp.initial();
    setUp.table();
    setUp.dialogContainer();
    setUp.dialogAbout();
    setUp.dialogComment();
    setUp.search();
    setUp.clickListeners();

});