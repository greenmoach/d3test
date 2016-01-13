/**
 * Created by etapp on 15/9/14.
 */

var yearChart = dc.rowChart('#year-chart');
var quarterChart = dc.pieChart('#quarter-chart');
var monthChart = dc.pieChart('#month-chart');
var dayChart = dc.rowChart('#day-chart');

var volumeChart = dc.barChart('#monthly-volume-chart');

var inoutChar = dc.compositeChart('#inout-line-chart');
var inChart = dc.lineChart(inoutChar);
var outChart = dc.lineChart(inoutChar);

d3.csv('content/RailSingleStation.csv', function (data) {
    // Since its a csv file we need to format the data a bit.
    var dateFormat = d3.time.format('%Y%m%d');
    var numberFormat = d3.format('.2f');

    data.forEach(function (d) {
        d.dd = dateFormat.parse(d.BOARD_DATE);
        d.month = d3.time.month(d.dd); // pre-calculate month for better performance
        d.in = +d.IN; // coerce to number
        d.out = +d.OUT;
    });

    //See the [crossfilter API](https://github.com/square/crossfilter/wiki/API-Reference) for reference.
    var ndx = crossfilter(data);
    var all = ndx.groupAll();


    var year = ndx.dimension(function (d) {
        var year = d.dd.getFullYear();
        return year;
    });
    var yearGroup = year.group().reduceSum(function (d) {
        return d.in + d.out;
    });

    var quarter = ndx.dimension(function (d) {
        var month = d.dd.getMonth();
        if (month <= 2) {
            return 'Q1';
        } else if (month > 2 && month <= 5) {
            return 'Q2';
        } else if (month > 5 && month <= 8) {
            return 'Q3';
        } else {
            return 'Q4';
        }
    });
    var quarterGroup = quarter.group().reduceSum(function (d) {
        return d.in + d.out;
    });


    var month = ndx.dimension(function (d) {
        var month = d.dd.getMonth();
        return (month + 1) + '月';
    });

    var monthGroup = month.group().reduceSum(function (d) {
        return d.in + d.out;
    });

    // Counts per weekday
    var dayOfWeek = ndx.dimension(function (d) {
        var day = d.dd.getDay();
        var name = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return day + '.' + name[day];
    });
    var dayOfWeekGroup = dayOfWeek.group().reduceSum(function (d) {
        return d.in + d.out;
    });

    // Dimension by month
    var moveMonths = ndx.dimension(function (d) {
        return d.month;
    });

    var volumeByMonthGroup = moveMonths.group().reduceSum(function (d) {
        return Math.abs(d.in - d.out);
    });

    var indexAvgByMonthGroup = moveMonths.group().reduceSum(function (d) {
        return d.out;
    });

    // Group by total movement within month
    var monthlyMoveGroup = moveMonths.group().reduceSum(function (d) {
        return d.in;
    });





    yearChart /* dc.rowChart('#day-of-week-chart', 'chartGroup') */
        .width(400)
        .height(220)
        .margins({top: 20, left: 10, right: 10, bottom: 20})
        .group(yearGroup)
        .dimension(year)
        // Assign colors to each value in the x scale domain
        .ordinalColors(['#3182bd', '#6baed6', '#9ecae1', '#c6dbef', '#dadaeb'])
        .label(function (d) {
            return d.key;
        })
        // Title sets the row text
        .title(function (d) {
            return d.value;
        })
        .elasticX(true)
        .xAxis().ticks(4);

    quarterChart /* dc.pieChart('#quarter-chart', 'chartGroup') */
        .width(180)
        .height(180)
        .radius(80)
        .innerRadius(30)
        .dimension(quarter)
        .group(quarterGroup);

    monthChart /* dc.pieChart('#month-chart', 'chartGroup') */
        .width(180)
        .height(180)
        .radius(80)
        .innerRadius(30)
        .dimension(month)
        .group(monthGroup);

    dayChart /* dc.rowChart('#day-of-week-chart', 'chartGroup') */
        .width(280)
        .height(220)
        .margins({top: 20, left: 10, right: 10, bottom: 20})
        .group(dayOfWeekGroup)
        .dimension(dayOfWeek)
        // Assign colors to each value in the x scale domain
        .ordinalColors(['#3182bd', '#6baed6', '#9ecae1', '#c6dbef', '#dadaeb'])
        .label(function (d) {
            return d.key.split('.')[1];
        })
        // Title sets the row text
        .title(function (d) {
            return d.value;
        })
        .elasticX(true)
        .xAxis().ticks(4);


    inoutChar
        .width(990)
        .height(200)
        .rangeChart(volumeChart)
        .yAxisLabel("人次")
        .margins({top: 30, right: 50, bottom: 25, left: 80})
        .legend(dc.legend().x(100).y(20).itemHeight(13).gap(5))
        .renderHorizontalGridLines(true)
        .x(d3.time.scale().domain([new Date(2005, 0, 1), new Date(2014, 11, 31)]))
        .round(d3.time.month.round)
        .xUnits(d3.time.months)
        .brushOn(false)
        .elasticY(true)
        .renderHorizontalGridLines(true)
        .compose([inChart, outChart])

    inChart /* dc.lineChart('#monthly-move-chart', 'chartGroup') */
        .renderArea(true)
        .transitionDuration(1000)
        .dimension(moveMonths)
        // Specify a "range chart" to link its brush extent with the zoom of the current "focus chart".

        //##### Legend
        .colors('red')
        // Position the legend relative to the chart origin and specify items' height and separation.
        .legend(dc.legend().x(800).y(10).itemHeight(13).gap(5))
        // Add the base layer of the stack with group. The second parameter specifies a series name for use in the
        // legend.
        // The `.valueAccessor` will be used for the base layer
        .group(indexAvgByMonthGroup, '火車站進站人次')
        .valueAccessor(function (d) {
            return d.value;
        })
        // Title can be called by any stack layer.
        .title(function (d) {
            return d.value;
        });

    outChart /* dc.lineChart('#monthly-move-chart', 'chartGroup') */
        .renderArea(true)
        .transitionDuration(1000)
        .dimension(moveMonths)
        // Specify a "range chart" to link its brush extent with the zoom of the current "focus chart".
        //##### Legend
        .colors('blue')
        // Position the legend relative to the chart origin and specify items' height and separation.
        .legend(dc.legend().x(800).y(10).itemHeight(13).gap(5))
        // Add the base layer of the stack with group. The second parameter specifies a series name for use in the
        // legend.
        // The `.valueAccessor` will be used for the base layer
        .group(monthlyMoveGroup, '火車站出站人次')
        .valueAccessor(function (d) {
            return d.value;
        })
        // Title can be called by any stack layer.
        .title(function (d) {
            return d.value;
        });

    //#### Range Chart

    // Since this bar chart is specified as "range chart" for the area chart, its brush extent
    // will always match the zoom of the area chart.
    volumeChart.width(990) /* dc.barChart('#monthly-volume-chart', 'chartGroup'); */
        .height(40)
        .margins({top: 0, right: 50, bottom: 20, left: 80})
        .dimension(moveMonths)
        .group(volumeByMonthGroup)
        .centerBar(true)
        .gap(1)
        .x(d3.time.scale().domain([new Date(2005, 0, 1), new Date(2014, 11, 31)]))
        .round(d3.time.month.round)
        .alwaysUseRounding(true)
        .xUnits(d3.time.months);


    dc.renderAll();
});