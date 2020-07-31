      require([
        "esri/config",
        "esri/Map",
        "esri/views/MapView",
        "esri/widgets/FeatureForm",
        "esri/layers/FeatureLayer",
        "esri/layers/TileLayer",
        "esri/layers/MapImageLayer",
        "esri/layers/GraphicsLayer",
        "esri/widgets/Measurement",
        "esri/widgets/Expand",
        "esri/widgets/BasemapGallery",
        "esri/widgets/BasemapToggle",
        "esri/widgets/Search",
        "esri/widgets/LayerList",
        "esri/widgets/LayerList/LayerListViewModel",
        "esri/widgets/Home",
        "esri/widgets/Legend",
        "esri/widgets/Print",
        "esri/widgets/Locate",
        "esri/widgets/Fullscreen",
        "esri/Graphic",
        "esri/widgets/Editor",
        "esri/layers/support/LabelClass",
        "esri/geometry/SpatialReference",
        "dgrid/OnDemandGrid",
        "dgrid/extensions/ColumnHider",
        "dojo/store/Memory",
        "dstore/legacy/StoreAdapter",
        "dgrid/Selection"
      ], function(
        esriConfig,
        WebMap,
        MapView,
        FeatureForm,
        FeatureLayer,
        TileLayer,
        MapImageLayer,
        GraphicsLayer,
        Measurement,
        Expand,
        BasemapGallery,
        BasemapToggle,
        Search,
        LayerList,
        LayerListVM,
        Home,
        Legend,
        Print,
        Locate,
        Fullscreen,
        Graphic,
        Editor,
        LabelClass,
        SpatialReference,
        OnDemandGrid, 
        ColumnHider, 
        Memory, 
        StoreAdapter, 
        Selection,
      ) {
      {
    esriConfig.portalUrl = "https://maps.trpa.org/portal";
        };

    // Initialize variables
    let sketchViewModel, highlight, editFeatureparcelLayerView, editor, features, parcelLayerView, landuseLayerView, grid;

    const gridDiv = document.getElementById("grid");
    const infoDiv = document.getElementById("info");

    let resultFeatures = [];

//    // create a new sketchviewmodel, setup it properties
//    // set up the click event for the select by polygon button
//    setUpSketchViewModel();
//    setupCSV();
//    sketchViewModel.on("create-complete", function(event) {
//    // this polygon will be used to query features that intersect it
//    selectFeatures(event.geometry);
//    });


    const gridFields = ["OBJECTID", "APN", "JURISDICTION", "OWN_FULL", "OWNERSHIP_TYPE","COUNTY_LANDUSE_DESCRIPTION", "TRPA_LANDUSE_DESCRIPTION", "IMPERVIOUS_SURFACE_SQFT", "AS_SUM", "UNITS", "ZONING_DESCRIPTION", "PARCEL_ACRES", "RESIDENTIAL_UNITS", "COMMERCIAL_FLOOR_AREA", "TOURIST_UNITS", "IPES_SCORE", "VACANT_BUILDABLE", "RETIRED" 
    ];
        var map = new WebMap({
              portalItem: { // autocasts as new PortalItem()
                id: "204dc5f342934f088f7ec4e8aa244829"
              }
            });
        
        // create teh view for the map
        var view = new MapView({
              map: map,  // The WebMap instance created above
              container: "viewDiv",
              center: [-120.01,38.92],
              zoom: 14,
              // set all popups to dock in the bottom right
              popup: {
                dockEnabled: true,
                dockOptions: {
                  // sets docking spot to top left
                  position: "bottom-right"
                }
              }
            });
        
        

        // construct regional land use layer
        const regionalLayer = new FeatureLayer({
          url: "https://maps.trpa.org/server/rest/services/LocalPlan/MapServer/9",
          title: "Regional Land Use",
          outFields: ["*"],
        });
        // add reginal land use layer to the map
        map.add(regionalLayer);
        // set to off in layer list
        regionalLayer.visible = false;
        
        // create edit action for land use in parcel popup
        const editThisAction = {
          title: "Edit",
          id: "edit-this",
          className: "esri-icon-edit"
        };

        // Create a popupTemplate for the land use layer and pass in a function to set its content and specify an action to handle editing the selected feature
        const template = {
          title: "Parcel: {APN}",
          content:[
              {
          type: "fields",
          fieldInfos: [
                {
                  fieldName: "TRPA_LANDUSE_DESCRIPTION",
                  label: "Existing Land Use"
                },
                {
                  fieldName: "COUNTY_LANDUSE_DESCRIPTION",
                  label: "County Land Use"
                },
                {
                  fieldName: "REGIONAL_LANDUSE",
                  label: "Regional Land Use",
                  },
                {
                  fieldName: "OWN_FULL",
                  label: "Owner Name"
                },
                {
                  fieldName: "OWNERSHIP_TYPE",
                  label: "Ownership Type",
                  },
                {
                  fieldName: "IMPERVIOUS_SURFACE_SQFT",
                  label: "Impervious Surface",
                  format: {
                    digitSeparator: true,
                    places: 0
                  },
                }
                ]
              }
              ],
          actions: [editThisAction],
          lastEditInfoEnabled: true              
        };
        
        // construct parcel land use layer from portal item
        const landuseLayer = new FeatureLayer({
          portalItem: {
            id: "667f76b9bfd94b80b62f70fe1d445924"
          },
          title: "Existing Land Use",
          outFields: ["*"],
          popupTemplate: template
        });
          
        // add land use layer to the map
        map.add(landuseLayer);
          
        // constrcut development rights feature set
        const devRights = new MapImageLayer({
            url: "https://maps.trpa.org/server/rest/services/Development_Rights_Transacted_and_Banked/MapServer"
          });
        
        map.add(devRights);

        // construct TRPA Boundary layer
        const builtLayer = new FeatureLayer({
          url: "https://maps.trpa.org/server/rest/services/Impervious_Surface_Cached/MapServer/0",
          title: "Impervious Surface - 2010",
          outFields: ["*"],
        });
        // add impervious surface layer to the map
        map.add(builtLayer);
        // set to off in layer list
        builtLayer.visible = false;
          
        // construct town center buffer layer
        const towncenterLayer = new FeatureLayer({
          url: "https://maps.trpa.org/server/rest/services/Planning_Buffers/MapServer/12",
          title: "Town Center - 1/4 Mile Buffer",
          outFields: ["*"],
        });
        // add town center layer to the map
        map.add(towncenterLayer);
        // set to off in layer list
        towncenterLayer.visible = false;
        
        // construct transit stop buffer layer
        const transithalfLayer = new FeatureLayer({
          url: "https://maps.trpa.org/server/rest/services/Planning_Buffers/MapServer/10",
          title: "Transit Stop - 1/2 Mile Walk",
          outFields: ["*"],
        });
        // add town center layer to the map
        map.add(transithalfLayer);
        // set to off in layer list
        transithalfLayer.visible = false;
          
        // construct transit stop buffer layer
        const transitquarterLayer = new FeatureLayer({
          url: "https://maps.trpa.org/server/rest/services/Planning_Buffers/MapServer/9",
          title: "Transit Stop - 1/4 Mile Walk",
          outFields: ["*"],
        });
        // add town center layer to the map
        map.add(transitquarterLayer);
        // set to off in layer list
        transitquarterLayer.visible = false;

        
        // create a new datastore for the on demandgrid
        // will be used to display attributes of selected features
        const dataStore = new StoreAdapter({
          objectStore: new Memory({
            idProperty: "OBJECTID"
          })
        });
        /****************************************************
         * Selects features from the layer that intersect
         * a polygon that user drew using sketch view model
         ****************************************************/
        function popGrid() {
          view.graphics.removeAll();
          if (landuseLayerView) {
            const query = {
              where: "1=1",
              outFields: ["*"]
            };

            // query graphics from the layer view. Geometry set for the query
            // can be polygon for point features and only intersecting geometries are returned
            landuseLayerView.queryFeatures(query).then(function(results) {
                const graphics = results.features;
                // if the grid div is displayed while query results does not
                // return graphics then hide the grid div and show the instructions div
                if (graphics.length > 0) {
                  gridDiv.style.zIndex = 90;
                  infoDiv.style.zIndex = 80;
                  document.getElementById("featureCount").innerHTML =
                    "<b>Showing attributes for " +
                    graphics.length.toString() + " features </b>"
                } else {
                  gridDiv.style.zIndex = 80;
                  infoDiv.style.zIndex = 90;
                }

                // get the attributes to display in the grid
                const data = graphics.map(function(feature, i) {
                  return Object.keys(feature.attributes)
                    .filter(function(key) {
                      // get fields that exist in the grid
                      return (gridFields.indexOf(key) !== -1);
                    })
                    // need to create key value pairs from the feature
                    // attributes so that info can be displayed in the grid
                    .reduce(function(obj, key) {
                      obj[key] = feature.attributes[key];
                      return obj;
                    }, {});
                });

                // set the datastore for the grid using the
                // attributes we got for the query results
                dataStore.objectStore.data = data;
                grid.set("collection", dataStore);
              })
              .catch(errorCallback);
          }
        }
        /************************************************
         * fires when user clicks a row in the grid
         * get the corresponding graphic and select it
         *************************************************/
        function selectFeatureFromGrid(event) {
          // close view popup if it is open
          view.popup.close();
          // get the ObjectID value from the clicked row
          const row = event.rows[0]
          const id = row.data.OBJECTID;

          // setup a query by specifying objectIds
          const query = {
            objectIds: [parseInt(id)],
            outFields: ["*"],
            returnGeometry: true,
            outSpatialReference: view.SpatialReference
          };

          // query the csvLayerView using the query set above
          landuseLayerView.queryFeatures(query).then(function(results) {
              const graphics = results.features;
              // remove all graphics to make sure no selected graphics
              view.graphics.removeAll();
              view.goTo(graphics[0].geometry);

              // create a new selected graphic
              const selectedGraphic = new Graphic({
                geometry: graphics[0].geometry,
                symbol: {
                  type: "simple-fill",
                  color: [130, 194, 232, 0.4],
                  style: "solid",
                  outline: {  // autocasts as new SimpleLineSymbol()
                    color:[130, 194, 232, 0.4],
                    width: 3
                  }
                }
              });

              // add the selected graphic to the view
              // this graphic corresponds to the row that was clicked
              view.graphics.add(selectedGraphic);
            })
            .catch(errorCallback);
        }

        /************************************************
         * Creates a new grid. Loops through layer 
         * fields and creates grid columns
         * Grid with selection and columnhider extensions
         *************************************************/
        function createGrid(fields) {
          var columns = fields.filter(function(field, i) {
            if (gridFields.indexOf(field.name) !== -1) {
              return field;
            }
              
          }).map(function(field) {
            if (field.name === "APN" || field.name === "JURISDICTION" || field.name === "OWNERSHIP_TYPE"|| field.name === "TRPA_LANDUSE_DESCRIPTION") {
              return {
                field: field.name,
                label: field.alias,
                sortable: true,
                hidden: false
              };
            } else {
              return {
                field: field.name,
                label: field.alias,
                sortable: true,
                hidden: true
              };
            }
          });

          // create a new onDemandGrid with its selection and columnhider
          // extensions. Set the columns of the grid to display attributes
          // the hurricanes cvslayer
          grid = new(OnDemandGrid.createSubclass([Selection, ColumnHider]))({
            columns: columns
          }, "grid");

          // add a row-click listener on the grid. This will be used
          // to highlight the corresponding feature on the view
          grid.on("dgrid-select", selectFeatureFromGrid);
        }
        
        function errorCallback(error) {
          console.log("error:", error)
        }
        
        // create a grid with given columns once the layer is loaded
        landuseLayer.when(function () {
            // create a grid with columns specified in gridFields variable
            createGrid(landuseLayer.fields);

            // get a reference the landuselayerview when it is ready.
            view.whenLayerView(landuseLayer).then(function (layerView) {
              landuseLayerView = layerView;
                //wait for the layerview to be done updating
              landuseLayerView.watch("updating", function(bool){
                if(!bool){
                  popGrid();
                }
              })
            });
          })
          .catch(errorCallback);

        // create grid expand
        const gridExpand = new Expand({
          expandTooltip: "Show Attribute Table",
          expanded: false,
          view: view,
          content: document.getElementById("gridDiv"),
          expandIconClass: "esri-icon-table",
          group: "bottom-right"
        });  

        // create the editor when a parcel popup edit action button is clicked
        view.when(function() {
          // Create the Editor with the specified layer and a list of field configurations
          editor = new Editor({
            view: view,
            container: document.createElement("div"),
            layerInfos: [
              {
                layer: landuseLayer,
                fieldConfig: [
                  {
                    name: "TRPA_LANDUSE_DESCRIPTION",
                    label: "Existing Land Use",
                    hint: "Comercial, Residential, etc.."
                  },
                  {
                    name: "COUNTY_LANDUSE_DESCRIPTION",
                    label: "County Land Use",
                    editable: false
                  },
                  {
                    name: "REGIONAL_LANDUSE",
                    label: "Regional Land Use",
                    editable: false
                    },
                  {
                    name: "OWN_FULL",
                    label: "Owner Name",
                    editable: false
                  },
                  {
                    name: "OWNERSHIP_TYPE",
                    label: "Ownership Type",
                    editable: false
                  }

                ]
              }
            ]
          });

          // Execute each time the "Edit feature" action is clicked
          function editThis() {
            // If the EditorViewModel's activeWorkflow is null, make the popup not visible
            if (!editor.viewModel.activeWorkFlow) {
              view.popup.visible = false;
              // Call the Editor update feature edit workflow

              editor.startUpdateWorkflowAtFeatureEdit(
                view.popup.selectedFeature
              );
              view.ui.add(editor, "bottom-right");
              view.popup.spinnerEnabled = false;
            }

            // We need to set a timeout to ensure the editor widget is fully rendered. We
            // then grab it from the DOM stack
            setTimeout(function() {
              // Use the editor's back button as a way to cancel out of editing
              let arrComp = editor.domNode.getElementsByClassName(
                "esri-editor__back-button esri-interactive"
              );
              if (arrComp.length === 1) {
                // Add a tooltip for the back button
                arrComp[0].setAttribute(
                  "title",
                  "Cancel edits, return to popup"
                );
                // Add a listerner to listen for when the editor's back button is clicked
                arrComp[0].addEventListener("click", function(evt) {
                  // Prevent the default behavior for the back button and instead remove the editor and reopen the popup
                  evt.preventDefault();
                  view.ui.remove(editor);
                  view.popup.open({
                    features: features
                  });
                });
              }
            }, 150);
          }

          // Event handler that fires each time an action is clicked
          view.popup.on("trigger-action", function(event) {
            if (event.action.id === "edit-this") {
              editThis();
            }
          });
        });

        // Watch when the popup is visible
        view.popup.watch("visible", function(event) {
          // Check the Editor's viewModel state, if it is currently open and editing existing features, disable popups
          if (editor.viewModel.state === "editing-existing-feature") {
            view.popup.close();
          } else {
            // Grab the features of the popup
            features = view.popup.features;
          }
        });

        landuseLayer.on("apply-edits", function() {
          // Once edits are applied to the layer, remove the Editor from the UI
          view.ui.remove(editor);

          // Iterate through the features
          features.forEach(function(feature) {
            // Reset the template for the feature if it was edited
            feature.popupTemplate = template;
          });

          // Open the popup again and reset its content after updates were made on the feature
          if (features) {
            view.popup.open({
              features: features
            });
          }

          // Cancel the workflow so that once edits are applied, a new popup can be displayed
          editor.viewModel.cancelWorkflow();
            });
                  
        // Add a legend instance to the panel of a
        // ListItem in a LayerList instance
        const layerList = new LayerList({
              view: view,
              listItemCreatedFunction: function(event) {
                const item = event.item;
                if (item.layer.type != "group") {
                  // don't show legend twice
                  item.panel = {
                    content: "legend",
                    open: false
                  };
                }
              }
        });
            
        view.ui.add(layerList, "top-right");

        // Create collapasable button for Table of Contents
        var layerListExpand = new Expand({
                expandIconClass: "esri-icon-layers",  // see https://developers.arcgis.com/javascript/latest/guide/esri-icon-font/
                expandTooltip: "Layer List",
                view: view,
                autoCollapse: true,
                content: layerList.domNode,
                group: "top-right"
            });

        // add layer list button to the top right corner of the view
        view.ui.add(layerListExpand, "top-right");

        // function to create print service
        view.when(function() {
            var print = new Print({
                container: document.createElement("div"),
                view: view,
                // specify print service url
                printServiceUrl:"https://utility.arcgisonline.com/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task"
        });


        // Create Print Button
        var printExpand = new Expand({
            expandIconClass: "esri-icon-printer",  // see https://developers.arcgis.com/javascript/latest/guide/esri-icon-font/
            expandTooltip: "Print",
            view: view,
            autoCollapse: true,
            content: print.domNode,
            group: "top-right"
            });

        // Add print widget to the top right corner of the view
        view.ui.add(printExpand, "top-right");
        });

        var parcels = new FeatureLayer({
            url: "https://maps.trpa.org/server/rest/services/Parcels/MapServer/0",
//                popupTemplate: {
//                // autocasts as new PopupTemplate()
//                    title: "Parcel: {APN}",
//                    overwriteActions: false
//                }
        });

        // Create Search Widget
        var searchWidget = new Search({
          view: view,
          allPlaceholder: "Address or APN",
          locationEnabled: false,
          includeDefaultSources: false,
          popupEnabled: false,
          sources: [
            {
              layer: landuseLayer,
              searchFields: ["APO_ADDRESS"],
              displayField: "APO_ADDRESS",
              exactMatch: false,
              outFields: ["APO_ADDRESS"],
              name: "Address",
              zoomScale: 24000,
            },
            {
              layer: landuseLayer,
              searchFields: ["APN"],
              displayField: "APN",
              exactMatch: false,
              outFields: ["APN"],
              name: "APN",
              zoomScale: 24000,
            }
          ]
        });

        // Add the search widget to the top left corner of the view
        view.ui.add(searchWidget, {
            position: "top-left"
        });

        // move zoom buttons to top left
        view.ui.move("zoom", "top-left");

        // Createa Home Button
        var homeWidget = new Home({
            view: view
        });

        // adds the home widget to the top left corner of the MapView
        view.ui.add(homeWidget, "top-left");            

        var basemapToggle = new BasemapToggle({
            container: document.createElement("div"),
            view: view,
            nextBasemap: "hybrid"  // Allows for toggling to the "hybrid" basemap
        });

        // Create an Expand instance and set the content
        // property to the DOM node of the basemap gallery widget
        var bgExpand = new Expand({
            expandIconClass: "esri-icon-basemap",  // see https://developers.arcgis.com/javascript/latest/guide/esri-icon-font
            expandTooltip: "Toggle Basemap",
            view: view,
            content: basemapToggle.domNode,
            group: "bottom-left"
        });

        // Add the basemap gallery button
        view.ui.add(bgExpand, "bottom-left"); 

        // add a legend widget instance to the viewd
        const legend = new Expand({
            expandIconClass: "esri-icon-layer-list",  // see https://developers.arcgis.com/javascript/latest/guide/esri-icon-font
            expandTooltip: "Legend",
            content: new Legend({
                view: view,
                style: "card" // other styles include 'card'
                }),
            view: view,
            expanded: false,
            group: "bottom-left"
        });

        view.ui.add(legend, "bottom-left");  

        const landuseNodes = document.querySelectorAll(`.landuse-item`);
        const landuseElement = document.getElementById("landuse-filter");

        // click event handler for landuse choices
        landuseElement.addEventListener("click", filterByLandUse);

        // User clicked on landuse to set an attribute filter
        function filterByLandUse(event) {
          const selectedLanduse = event.target.getAttribute("data-landuse");
          landuseLayerView.filter = {
            where: "TRPA_LANDUSE_DESCRIPTION" + selectedLanduse
          };
        }

        // after land use layer loads create the widget
        view.whenLayerView(landuseLayer).then(function(layerView) {
          // land use layer loaded
          // get a reference to the land use layerview
          landuseLayerView = layerView;

        // set up UI items
        landuseElement.style.visibility = "visible";

        const landuseExpand = new Expand({
            view: view,
            content: landuseElement,
            expandTooltip: "Filter Land Use Type",
            expandIconClass: "esri-icon-filter",
            group: "top-right"
          });

        //clear the filters when user closes the expand widget
        landuseExpand.watch("expanded", function() {
            if (!landuseExpand.expanded) {
              landuseLayerView.filter = null;
            }
          });
        view.ui.add(landuseExpand, "top-right");
        });
          
        var locate = new Locate({
        view: view,
        useHeadingEnabled: false,
        goToOverride: function(view, options) {
          options.target.scale = 1500;  // Override the default map scale
          return view.goTo(options.target);
        }
        });

        view.ui.add(locate, "top-left");

        view.ui.add(
          new Fullscreen({
            view: view,
          }),
          "top-left"
        );
        
        // Add grid expand to the view
        view.ui.add(gridExpand, "bottom-right");
          
   /****************************************************
   * Selects features from the layer that intersect
   * a polygon that user drew using sketch view model
   ****************************************************/
  function selectFeatures(geometry) {
    view.graphics.removeAll();
    if (landuseLayerView) {
      // create a query and set its geometry parameter to the
      // polygon that was drawn on the view
      const query = {
        geometry: geometry,
        outFields: ["*"]
      };

      // query graphics from the layer view. Geometry set for the query
      // can be polygon for point features and only intersecting geometries are returned
      landuseLayerView
        .queryFeatures(query)
        .then(function(results) {
          const graphics = results.features;
          resultFeatures = graphics;
          // if the grid div is displayed while query results does not
          // return graphics then hide the grid div and show the instructions div
          if (graphics.length > 0) {
            // zoom to the extent of the polygon with factor 2
            view.goTo(geometry.extent.expand(2));
            gridDiv.style.zIndex = 90;
            infoDiv.style.zIndex = 80;
            document.getElementById("featureCount").innerHTML =
              "<b>Showing attributes for " +
              graphics.length.toString() +
              " features </b>";
          } else {
            gridDiv.style.zIndex = 80;
            infoDiv.style.zIndex = 90;
          }

          // remove existing highlighted features
          if (highlight) {
            highlight.remove();
          }

          // highlight query results
          highlight = landuseLayerView.highlight(graphics);

          // get the attributes to display in the grid
          const data = graphics.map(function(feature, i) {
            return (Object.keys(feature.attributes)
                .filter(function(key) {
                  // get fields that exist in the grid
                  return gridFields.indexOf(key) !== -1;
                })
                // need to create key value pairs from the feature
                // attributes so that info can be displayed in the grid
                .reduce(function(obj, key) {
                  obj[key] = feature.attributes[key];
                  return obj;
                }, {}) );
          });

          // set the datastore for the grid using the
          // attributes we got for the query results
          dataStore.objectStore.data = data;
          grid.set("collection", dataStore);
        })
        .catch(errorCallback);
    }
  }

  /************************************************************************
   * Sets up the sketchViewModel. When user clicks on the select by polygon
   * button sketchViewModel.create() method is called with polygon param.
   ************************************************************************/
  function setUpSketchViewModel() {
    // polygonGraphicsLayer will be used by the sketchviewmodel
    // show the polygon being drawn on the view
    const polygonGraphicsLayer = new GraphicsLayer();
    map.add(polygonGraphicsLayer);

    // add the select by polygon button the view
    view.ui.add("select-by-polygon", "bottom-right");
    const selectButton = document.getElementById("select-by-polygon");

    // click event for the button
    selectButton.addEventListener("click", function() {
      clearUpSelection();
      view.popup.close();
      // ready to draw a polygon
      sketchViewModel.create("polygon");
    });

    // create a new sketch view model set its layer
    sketchViewModel = new SketchViewModel({
      view: view,
      layer: polygonGraphicsLayer,
      pointSymbol: {
        type: "simple-marker",
        color: [255, 255, 255, 0],
        size: "1px",
        outline: {
          color: "gray",
          width: 0
        }
      }
    });
  }

  function clearUpSelection() {
    view.graphics.removeAll();
    grid.clearSelection();
  }
  /*********************************************************
   * Set up CSV export
   *********************************************************/
  
  function setupCSV() {
    view.ui.add("btn-export", "top-left");
    const btn = document.getElementById("btn-export");
    btn.addEventListener("click", () => {
      if (resultFeatures.length) {
        // export to csv
        const attrs = resultFeatures.map(a => a.attributes);
        const headers = {};
        const entry = attrs[0];
        for (let key in entry) {
          if (entry.hasOwnProperty(key)) {
            headers[key] = key;
          }
        }
        exportCSVFile(headers, attrs, "export");
      }
    });
  }

  // export functions
  // https://medium.com/@danny.pule/export-json-to-csv-file-using-javascript-a0b7bc5b00d2
  function convertToCSV(objArray) {
    const array = typeof objArray != "object" ? JSON.parse(objArray) : objArray;
    let str = "";

    for (let i = 0; i < array.length; i++) {
      let line = "";
      for (let index in array[i]) {
        if (line != "") line += ",";

        line += array[i][index];
      }

      str += line + "\r\n";
    }

    return str;
  }

  function exportCSVFile(headers, items, fileTitle) {
    if (headers) {
      items.unshift(headers);
    }

    // Convert Object to JSON
    var jsonObject = JSON.stringify(items);

    const csv = convertToCSV(jsonObject);

    const exportedFilenmae = fileTitle + ".csv" || "export.csv";

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    if (navigator.msSaveBlob) {
      // IE 10+
      navigator.msSaveBlob(blob, exportedFilenmae);
    } else {
      const link = document.createElement("a");
      if (link.download !== undefined) {
        // feature detection
        // Browsers that support HTML5 download attribute
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", exportedFilenmae);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
  }
});