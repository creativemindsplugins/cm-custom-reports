(function ($) {

    $(document).ready(function ($) {

        function initGraphSizes() {
            if (window.cmcr_graph_data === undefined) {
                return;
            }
            let $graph = $('#' + window.cmcr_graph_data.placeholder_id);
            if ($graph.length) {
                let $wrapper = $graph.parent();
                let pleft = parseFloat($wrapper.css('padding-left')) * 2;
                let w = $wrapper.width() - pleft;
                let h = w / 3;
                $graph.css({'height': `${h}px`});
            }
        }
        initGraphSizes();

        $('.cmcr_reports_group_wrapper').foldable({
            'titleWrapper' : '<h3>'
        });

        $('.cmcr_reports_group_wrapper h3.cmcr_reports_group_label').on('click', function () {
            var parent = $(this).parents('.cmcr_reports_group_wrapper');
            parent.foldable('toggle');
        });

        $('.cmcr_report_unfav a img').on('mouseover', function(){
            var src = $(this).attr('src');
            var newSrc = src.replace('fav-hover-icon', 'fav-icon');
            $(this).attr('src', newSrc);
        });

        $('.cmcr_report_unfav a img').on('mouseout', function(){
            var src = $(this).attr('src');
            var newSrc = src.replace('fav-icon', 'fav-hover-icon');
            $(this).attr('src', newSrc);
        });

        $('.cmcr_report_fav a img').on('mouseover', function(){
            var src = $(this).attr('src');
            var newSrc = src.replace('fav-icon', 'fav-hover-icon');
            $(this).attr('src', newSrc);
        });

        $('.cmcr_report_fav a img').on('mouseout', function(){
            var src = $(this).attr('src');
            var newSrc = src.replace('fav-hover-icon', 'fav-icon');
            $(this).attr('src', newSrc);
        });

        var plot, tabs;

        if ($.fn.tabs) {
            tabs = $('#cmcr_tabs').tabs({
                activate: function (event, ui) {
                    window.location.hash = ui.newPanel.attr('id').replace(/-/g, '_');
                    $(document).trigger('cmcr-tab-change');
                },
                create: function (event, ui) {
                    var tab = location.hash.replace(/\_/g, '-');
                    if (tab)
                    {
                        var tabContainer = $(ui.panel.context).find('a[href="' + tab + '"]');
                        if (typeof tabContainer !== 'undefined' && tabContainer.length)
                        {
                            var index = tabContainer.parent().index();
                            $(ui.panel.context).tabs('option', 'active', index);
                        }
                    }
                }
            });
        }

        if ($.fn.plot && typeof window.cmcr_graph_data !== 'undefined')
        {
            var datepicker_options = typeof window.cmcr_graph_data.datepicker_options !== 'undefined' ? window.cmcr_graph_data.datepicker_options : {};
            $('input.datepicker').datepicker(datepicker_options);

            var placeholder_id = '#' + window.cmcr_graph_data.placeholder_id;

            var data = window.cmcr_graph_data.data;

//          Required for lines
//            if (data.length)
//            {
//                jQuery(data).each(function (k, v) {
//                    v.data = prepareData(v.data);
//                });
//            }

            var default_options = {
                tooltipOpts: {
                    'id': 'cmcr-graph-tooltip',
                    'content': function (label, x, y) {
                        var date = new Date(+x);
                        var tooltip = '<h4>' + label + '</h4><ul>';
                        tooltip += '<li>Date: ' + date.toLocaleDateString() + '</li>';
                        tooltip += '<li>Total Count: ' + y + '</li></ul>';
                        return tooltip;
                    },
                    'defaultTheme': false
                },
                'tooltip': true
            };
            var passed_options = typeof window.cmcr_graph_data.options !== 'undefined' ? window.cmcr_graph_data.options : {};
            var options = $.extend({}, default_options, passed_options);
            var xaxis = $.extend({}, options.xaxis);
            var yaxis = $.extend({}, options.yaxis);
            var options_bak = $.extend({}, options);

            function cmcr_showFlotChart () {
                if ($(placeholder_id).is(':visible'))
                {
                    plot = $.plot(placeholder_id, data, options);
                }
            }

            function cmcr_labelFormatter (label, series) {
                return "<div style='font-size:8pt; text-align:center; padding:2px; color:white;'>" + label + "<br/>" + Math.round(series.percent) + "%</div>";
            }

            $(document).on('cmcr-tab-change', function () {
                cmcr_showFlotChart();
            });
            cmcr_showFlotChart();

            $('#graph-type-select').on('change', function (e) {
                e.preventDefault();

                options.xaxis = $.extend({}, xaxis);
                options.yaxis = $.extend({}, yaxis);

                var val = $(this).val();
                switch(val)
                {
                    case 'points':
                    {
                        options.series = {
                            'points':
                                    {
                                        'show': true
                                    }
                        };
                        break;
                    }
                    case 'pie':
                    {
                        options.series = {
                            'pie':
                                    {
                                        show: true,
                                        radius: 1,
                                        label: {
                                            show: true,
                                            radius: 2 / 3,
                                            formatter: cmcr_labelFormatter,
                                            threshold: 0.1
                                        }
                                    }
                        };
                        options.xaxis.axisLabel = null;
                        options.yaxis.axisLabel = null;
                        break;
                    }
                    case 'lines':
                    {
                        options.series = {
                            'lines':
                                    {
                                        'show': true
                                    }
                        };
                        break;
                    }
                    default:
                    case 'bars':
                    {
                        options.series = {
                            'bars':
                                    {
                                        'show': true,
                                        'barWidth': 24 * 60 * 60 * 1000,
                                        'align': 'center'
                                    }
                        };
                        break;
                    }
                }
                cmcr_showFlotChart();
            });

            $('#graph-to-pdf').on('click', function (e) {
                e.preventDefault();

                html2canvas($(placeholder_id).get(0), {
                    'background': "#ffffff",
                    onrendered: function (canvas) {

                        var imgData = canvas.toDataURL('image/jpeg');
                        var doc = new jsPDF('l', 'mm', 'a4');
                        var report_name = 'cm-custom-report-' + window.cmcr_graph_data.current_report.slug;

                        doc.setFontSize(30);
                        doc.text(20, 20, window.cmcr_graph_data.current_report.name_filtered);

                        doc.setFontSize(16);
                        doc.text(20, 30, window.cmcr_graph_data.current_report.description);
                        doc.addImage(imgData, 'JPEG', 20, 40, 250, 81);
                        doc.save(report_name + '.pdf');
                    }
                });

            });

            $.redirect = function (target, values, method) {

                method = (method && method.toUpperCase() == 'GET') ? 'GET' : 'POST';

                if (!values)
                {
                    var obj = $.parse_url(target);
                    target = obj.url;
                    values = obj.params;
                }

                var form = $('<form>', {attr: {
                        method: method,
                        action: target
                    }});

                for(var i in values)
                {
                    $('<input>', {
                        attr: {
                            type: 'hidden',
                            name: i,
                            value: values[i]
                        }
                    }).appendTo(form);

                }

                $('body').append(form);
                form.submit();
            };

            $.parse_url = function (url)
            {
                if (url.indexOf('?') == -1)
                    return {url: url, params: {}}

                var parts = url.split('?');
                var url = parts[0];
                var query_string = parts[1];

                var return_obj = {};
                var elems = query_string.split('&');

                var obj = {};

                for(var i in elems)
                {
                    var elem = elems[i];
                    var pair = elem.split('=');
                    obj[pair[0]] = pair[1];
                }

                return_obj.url = url;
                return_obj.params = obj;

                return return_obj;
            }

            function prepareData (data) {
                if (data && data.length > 0) {
                    var oneDay = 86400000;
                    var newData = [];

                    // new zero value point before the old first point
                    newData.push([(parseInt(data[0][0], 10) - oneDay).toString(), "0"]);

                    for(var i = 0; i < data.length; i++){
                        // add existing point to new data
                        newData.push(data[i]);

                        // check distance between this point and the next (if not last point)
                        if (i < data.length - 1) {
                            var thisPointTimestamp = parseInt(data[i][0], 10);
                            var nextPointTimestamp = parseInt(data[i + 1][0], 10);

                            // if distance is two days, insert ony zero value point in between
                            if (nextPointTimestamp - thisPointTimestamp == 2 * oneDay) {
                                newData.push([(thisPointTimestamp + oneDay).toString(), "0"]);
                            }
                            // if distance is more then two days, insert one zero value point
                            // directly after this day and one directly before the next day
                            else if (nextPointTimestamp - thisPointTimestamp > 2 * oneDay) {
                                newData.push([(thisPointTimestamp + oneDay).toString(), "0"]);
                                newData.push([(nextPointTimestamp - oneDay).toString(), "0"]);
                            }
                        }
                    }

                    // new zero value point after the old last point
                    newData.push([(parseInt(data[data.length - 1][0], 10) + oneDay).toString(), "0"]);

                    return newData;
                }
            }
        }
    });

})(jQuery);