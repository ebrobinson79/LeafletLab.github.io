//Step 1: A map needs to be created 
function createMap(){
    //create the map
    var map = L.map('map', {
        center: [50, 20],
        zoom: 4
    });

    //add OSM base tilelayer
    var streets = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
    });
    
    var grayCanvas = L.tileLayer.provider('Esri.WorldGrayCanvas');
    
    var baseMaps = {
    "Grayscale": grayCanvas,
    "Streets": streets
};
    L.control.layers(baseMaps).addTo(map);
    
    var baseMaps = {
    "<span style='color: gray'>Grayscale</span>": grayCanvas,
    "Streets": streets
};
    
     L.tileLayer.provider('Esri.WorldGrayCanvas').addTo(map);
    
    //call getData function
    getData(map);
};

//Step 3: Add circle markers for point features to the map
function createPropSymbols(data, map){
    //Step 4: Determine which attribute to visualize with proportional symbols
   
    //create a Leaflet GeoJSON layer and add it to the map
    L.geoJson(data, {
        pointToLayer: function (feature, latlng) {
             //Step 5: For each feature, determine its value for the selected attribute
            var attValue = Number(feature.properties[attribute]);

            //examine the attribute value to check that it is correct
            console.log(feature.properties, attValue);
            
            //Step 6: Give each feature's circle marker a radius based on its attribute value
            geojsonMarkerOptions.radius = calcPropRadius(attValue)/4;

            //create circle markers
            return L.circleMarker(latlng, geojsonMarkerOptions);
        }
    }).addTo(map);
};



///function to create the legend
function createLegend(map, attributes){
    var LegendControl = L.Control.extend({
        options: {
            position: 'bottomright'
        },

        onAdd: function (map) {
            // create the control container with a particular class name
            var container = L.DomUtil.create('div', 'legend-control-container');

            //add temporal legend div to container
            $(container).append('<div class="btn-dark" id="temporal-legend">')

            //Step 1: start attribute legend svg string
            var svg = '<svg id="attribute-legend" width="250px" height="180px">';

            //array of circle names to base loop on
             var circles = {
            max: 20,
            mean: 40,
            min: 60
        };

            //Step 2: loop to add each circle and text to svg string
            for (var circle in circles){
            //circle string
            svg += '<circle class="legend-circle" id="' + circle + '" fill="#6495ED" fill-opacity="0.8" stroke="#000000" cx="50"/>';

            //text string
            svg += '<text id="' + circle + '-text" x="100" y="' + circles[circle] + '"></text>';
        };

            //close svg string
            svg += "</svg>";
            //add attribute legend svg to container
            $(container).append(svg);

            return container;
        }
    });

    map.addControl(new LegendControl());

    updateLegend(map, attributes[0]);
};

//Calculate the max, mean, and min values for a given attribute
function getCircleValues(map, attribute){
    //start with min at highest possible and max at lowest possible number
    var min = Infinity,
        max = -Infinity;

    map.eachLayer(function(layer){
        //get the attribute value
        if (layer.feature){
            var attributeValue = Number(layer.feature.properties[attribute]);

            //test for min
            if (attributeValue < min){
                min = attributeValue;
            };

            //test for max
            if (attributeValue > max){
                max = attributeValue;
            };
        };
    });

    //set mean
    var mean = (max + min) / 2;

    //return values as an object
    return {
        max: max,
        mean: mean,
        min: 1
    };
};


//Update the legend with new attribute
function updateLegend(map, attribute){
    //create content for legend
    var year = attribute.split("_")[1];
    
    var content = "Tourism in " + year;
    
    //replace legend content
    $('#temporal-legend').html(content);

    //get the max, mean, and min values as an object
    var circleValues = getCircleValues(map, attribute);

    for (var key in circleValues){
      //get the radius
      var radius = calcPropRadius(circleValues[key])/4;
        
    

      //Step 3: assign the cy and r attributes
      $('#'+key).attr({
          cy: 83 - radius,
          r:  radius
          
      });

      //Step 4: add legend text
      $('#'+key+'-text').text(Math.round(circleValues[key]) + " Million Visits");
    };

    };


//Step 1: Create new sequence controls
function createSequenceControls(map,attributes){

    var SequenceControl = L.Control.extend({
      options: {
        position: 'bottomleft'
      },

      onAdd: function (map) {
        // create the control container div with a particular class name
        var container = L.DomUtil.create('div', 'sequence-control-container');

        //kill any mouse event listeners on the map
        $(container).on('mousedown dblclick', function(e){
            L.DomEvent.stopPropagation(e);
            L.DomEvent.disableClickPropagation(container);
        });

        // ... initialize other DOM elements, add listeners, etc.
        //create range input element (slider)
        $(container).append('<input class="range-slider" type="range">');

        //add skip buttons
        $(container).append('<button class="skip" id="reverse" title="reverse">Reverse</button>');
        $(container).append('<button class="skip" id="forward" title="forward">Skip</button>');



        return container;
      }
      });

    map.addControl(new SequenceControl());
    //create range input element (slider)

    //set slider attributes
    $('.range-slider').attr({
    max: 10,
    min: 0,
    value: 0,
    step: 1
    });


    //Below Example 3.5...replace button content with images
    $('#reverse').html('<img src="img/reverse.png">');
    $('#forward').html('<img src="img/forward.png">');
    

    //Step 5: click listener for buttons
    $('.skip').click(function(){
           //get the old index value
           var index = $('.range-slider').val();

           //Step 6: increment or decrement depending on button clicked
           if ($(this).attr('id') == 'forward'){
               index++;
               //Step 7: if past the last attribute, wrap around to first attribute
               index = index > 10 ? 0 : index;
           } else if ($(this).attr('id') == 'reverse'){
               index--;
               //Step 7: if past the first attribute, wrap around to last attribute
               index = index < 0 ? 10 : index;
           };

           //Step 8: update slider
           $('.range-slider').val(index);

           //Called in both skip button and slider event listener handlers
            //Step 9: pass new attribute to update symbols
            updatePropSymbols(map, attributes[index]);
       });

//Step 5: input listener for slider
    $('.range-slider').on('input', function(){
        //Step 6: get the new index value
        var index = $(this).val();

        //Called in both skip button and slider event listener handlers
        //Step 9: pass new attribute to update symbols
        updatePropSymbols(map, attributes[index]);

        console.log(index)
        console.log(attributes)
    });
};


//Step 2: Import GeoJSON data
function getData(map){
    //load the data
    $.ajax("data/Tourism3.geojson", {
        dataType: "json",
        success: function(response){
            //create an attributes array
            var attributes = processData(response);

            createPropSymbols(response, map, attributes);
            createSequenceControls(map, attributes);
            createLegend(map,attributes);
        }
    });
};

//calculate the radius of each proportional symbol
function calcPropRadius(attValue) {
    //scale factor to adjust symbol size evenly
    var scaleFactor = 1000;
    //area based on attribute value and scale factor
    var area = attValue * scaleFactor;
    //radius calculated based on area
    var radius = Math.sqrt(area/Math.PI);

    return radius;
};


//Example 2.1 line 1...function to convert markers to circle markers
//function to convert markers to circle markers
function pointToLayer(feature, latlng, attributes){
    //Determine which attribute to visualize with proportional symbols
    var attribute = attributes[0];

    //create marker options
    var options = {
        color: "#6495ED",
        weight: 1,
        opacity: .8,
        fillOpacity: 0.8
    };

    //For each feature, determine its value for the selected attribute
    var attValue = Number(feature.properties[attribute]);

    //Give each feature's circle marker a radius based on its attribute value
    options.radius = calcPropRadius(attValue)/4;

    //create circle marker layer
    var layer = L.circleMarker(latlng, options);

    //build popup content string
    var year = attribute.split("_")[1];
    var popupContent = "<p><b>Country:</b> " + feature.properties.Country + "</p><p><b>Tourism in " + year + ":</b> " + feature.properties[attribute] + " million visits" + "</p>";
    
    

    //bind the popup to the circle marker
    layer.bindPopup(popupContent);

    //return the circle marker to the L.geoJson pointToLayer option
    return layer;
};



//Example 2.1 line 34...Add circle markers for point features to the map
function createPropSymbols(data, map, attributes){
    //create a Leaflet GeoJSON layer and add it to the map
    L.geoJson(data, {
        pointToLayer: function(feature, latlng){
            return pointToLayer(feature, latlng, attributes);
        }
    }).addTo(map);
};

//Above Example 3.8...Step 3: build an attributes array from the data
function processData(data){
    //empty array to hold attributes
    var attributes = [];

    //properties of the first feature in the dataset
    var properties = data.features[0].properties;

    //push each attribute name into attributes array
    for (var attribute in properties){
        //only take attributes with population values
        if (attribute.indexOf("Year") > -1){
            attributes.push(attribute);
        };
    };

    

    return attributes;
};          
                  
//Step 10: Resize proportional symbols according to new attribute values
function updatePropSymbols(map, attribute){
    map.eachLayer(function(layer){
       //Example 3.16 line 4
        if (layer.feature && layer.feature.properties[attribute]){
            //access feature properties
            var props = layer.feature.properties;

            //update each feature's radius based on new attribute values
            var radius = calcPropRadius(props[attribute])/4;
            layer.setRadius(radius);

            //add city to popup content string
            var popupContent = "<p><b>Country:</b> " + props.Country + "</p>";

            //add formatted attribute to panel content string
            var year = attribute.split("_")[1];
            popupContent += "<p><b>Tourism in " + year + ":</b> " + props[attribute] + " million visits</p>";

            //replace the layer popup
            layer.bindPopup(popupContent, {
                offset: new L.Point(0,-radius)
            });
        };
    });
    updateLegend(map,attribute)
};





$(document).ready(createMap);

