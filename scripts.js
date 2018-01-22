// execute when the DOM is fully loaded
$(function() {
  var col;
  var dataset={};
  var countries=[];

  // get data from back-end and process them
  d3.json(Flask.url_for("collection"), function(error, json) {
    if (error) return console.warn(error);
    col=json;

    // group data by country
    countries=d3.nest()
      .key(function(d) {return d.countrycode;})
      .entries(col);

    // calculate sum for countries and find min and max sum for the paletteScale
    var min, iter=0, max=0;
    for(var country of countries){
      var sum=0;
      for (var item of country.values){
        var a=parseInt(item.lendprojectcost);
        sum=sum+a;
      }
      if (sum>max) {
        max=sum;
      }
      if (iter==0) {
      min=sum;
      iter=1;
      }
      if(sum<min) {
      min = sum;
      }
      dataset[country.key] = {numberOfThings: sum};
    }
    // create color palette function
    var paletteScale = d3.scale.linear()
      .domain([min,max])
      .range(["#EFEFFF","#02386F"]); // blue color

    // add 'fillColor' to dataset
    for (var entry in dataset) {
      dataset[entry]['fillColor'] = paletteScale(dataset[entry]['numberOfThings']);
    }

    // render map
    new Datamap({
        element: document.getElementById('container'),
        projection: 'mercator', // big world map

        // countries don't listed in dataset will be painted with this color
        fills: { defaultFill: '#F5F5F5' },
        data: dataset,
        geographyConfig: {
            borderColor: '#DEDEDE',
            highlightBorderWidth: 2,

            // don't change color on mouse hover
            highlightFillColor: function(geo) {
                return geo['fillColor'] || '#F5F5F5';
            },

            // only change border
            highlightBorderColor: '#B7B7B7',

            // show desired information in tooltip
            popupTemplate: function(geo, data) {

                // don't show tooltip if country don't present in dataset
                if (!data) { return ; }

                tmp=geo.id;
                var obj = countries.find(function(value, index, array) {
                  if (value['key']==tmp) {
                    return value;
                  }
                });
                var str0=obj.values[0].countryname;
                var str='';
                for (var item in obj.values){
                  str+='Project name: '+obj.values[item]["project_name"]+'<br>Lend project cost: '+obj.values[item]["lendprojectcost"]+'<br><br>';
                }
                return ['<div class="hoverinfo">',
                    '<strong>', str0, '</strong>',
                    '<br><br>', str,
                    'The whole country sum: <strong>', data.numberOfThings, '</strong>',
                    '</div>'].join('');
            }
        }
    });
  });
});