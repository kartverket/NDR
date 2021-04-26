import React, { Component } from 'react';
import * as Cesium from 'cesium';
import "cesium/Build/Cesium/Widgets/widgets.css";
import './App.css';
import { Scene } from 'cesium';


class Cesium3DMap extends Component {
    render() {
        return (
            <div id='cesiumContainer' />
        );
    }

    componentDidMount() {
        this.initCesiumViewer();
    }

    initCesiumViewer() {
        Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI3NzU3OWMyYy05ZDI2LTQyMmItYWQ1YS1iZDcxODZjNTRhZDkiLCJpZCI6MzU5NjIsImlhdCI6MTYwMjc1OTQ1MH0.RS_K1nKTY1uUkWC_drKOYRNsfrl31PrYVfjvNvxGfGs';

        // Geodata Online terrain service doesn't work for some reason. The map disappears
        // const terrainProvider = new Cesium.ArcGISTiledElevationTerrainProvider({
        //     url: 'https://services.geodataonline.no/arcgis/rest/services/Geocache_WMAS_WGS84/GeocacheTerreng/ImageServer',
        //     token: 'oRASk_RrGErrX2RDyt719yiPZQJx7SM8ASyGnbbNLVTNbqzw2gF7MX33Gdzo3tOF'
        // });

        // Esri terrain service works
        // const terrainProvider = new Cesium.ArcGISTiledElevationTerrainProvider({
        //     url: 'https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer',
        //     //token: 'oRASk_RrGErrX2RDyt719yiPZQJx7SM8ASyGnbbNLVTNbqzw2gF7MX33Gdzo3tOF'
        // });

        const imageryProvider = new Cesium.ArcGisMapServerImageryProvider({
            url: 'https://services.geodataonline.no/arcgis/rest/services/Geocache_WMAS_WGS84/GeocacheBilder/MapServer',
            token: 'oRASk_RrGErrX2RDyt719yiPZQJx7SM8ASyGnbbNLVTNbqzw2gF7MX33Gdzo3tOF'
        });

        const viewer = new Cesium.Viewer('cesiumContainer', {
            terrainProvider: Cesium.createWorldTerrain(),
            imageryProvider: imageryProvider,
            requestRenderMode: true,
            maximumRenderTimeChange: Infinity,
        });
        viewer.scene.skyBox.show = false;
        viewer.scene.requestRender();
        viewer.scene.globe.tileCacheSize = 1000;
        viewer.scene.globe.maximumScreenSpaceError = 5;

        this.addEptData('https://geodata-hosting-ndr-poc-ept-bucket.s3.eu-north-1.amazonaws.com/entwine/ski75test/ept-tileset/tileset.json', viewer);
        this.addEptData('https://ndr-poc-k8s10.geodataonline.no/ski05test/ept-tileset/tileset.json', viewer).then((tileset) => {
            viewer.zoomTo(tileset);
        });
    }

    applyStyleToTileset(tileset) {
        const tilesetStyle = new Cesium.Cesium3DTileStyle({
            pointSize: 2.0,
        });
    
        tileset.style = tilesetStyle; 
    }

    adjustTilsetHeightOffset(tileset) {
        const heightOffset = 47.0;
        const boundingSphere = tileset.boundingSphere;
        const cartographic = Cesium.Cartographic.fromCartesian(boundingSphere.center);
        const surface = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, 0.0);
        const offset = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, heightOffset);
        const translation = Cesium.Cartesian3.subtract(offset, surface, new Cesium.Cartesian3());
        tileset.modelMatrix = Cesium.Matrix4.fromTranslation(translation);
    }

    optimizeTileset(tileset) {
        tileset.dynamicScreenSpaceError = true;
        tileset.dynamicScreenSpaceErrorDensity = 0.5;
        tileset.dynamicScreenSpaceErrorFactor = 10.0;
        tileset.dynamicScreenSpaceErrorHeightFalloff = 0.10;
        tileset.skipLevelOfDetail = true;
        tileset.baseScreenSpaceError = 128;
        tileset.skipScreenSpaceErrorFactor = 64;
        tileset.skipLevels = 2;
    }

    addEptData(url, viewer) {
        return new Promise((resolve, reject) => {
            const tileset = new Cesium.Cesium3DTileset({
                url: url
            });
        
            tileset.readyPromise.then((readyTileset) => {
                // Make sure the tileset are correctly placed above ground
                this.adjustTilsetHeightOffset(readyTileset);
                this.applyStyleToTileset(readyTileset);
                this.optimizeTileset(readyTileset);
            
                viewer.scene.primitives.add(readyTileset);
    
                resolve(readyTileset);
            });
        });  
    }
}

export default Cesium3DMap;
