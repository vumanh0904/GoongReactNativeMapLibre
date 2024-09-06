import React, {useState, useRef, useEffect} from 'react';

import {
  TouchableOpacity,
  StyleSheet,
  Text,
  View,
  Dimensions,
  FlatList,
  Platform,
} from 'react-native';
import {
  SafeAreaInsetsContext,
  SafeAreaView,
} from 'react-native-safe-area-context';
import {SearchBar, Icon} from '@rneui/themed';
import MapLibreGL from '@maplibre/maplibre-react-native';
import MapAPi from '../core/api/MapAPI';
import GeneralStatusBar from '../config/generalStatusBar/GeneralStatusBar';
import polyline from '@mapbox/polyline';
MapLibreGL.setAccessToken(null);
const windowWidth = Dimensions.get('window').width;

const HomeScreen = ({navigation}) => {
  const [loadMap] = useState(
    'https://tiles.goong.io/assets/goong_map_web.json?api_key=<API_Key>',
  );
  const [currentLocation, setCurrentLocation] = useState([
    105.81911236900004, 21.03357551700003,
  ]);

  const [search, setSearch] = useState('');
  const [isShowLocation, setIsShowLocation] = useState(true);
  const [zoomLevel, setZoomlevel] = useState(14);
  const [route, setRoute] = useState([]);

  const [description, setDescription] = useState([]);
  const [locations, setLocations] = useState([]);

  const getPlacesAutocomplete = async () => {
    let autoComplete = await MapAPi.getPlacesAutocomplete({
      search: encodeURIComponent(search),
    });
    setDescription(autoComplete.predictions);
  };

  const camera = useRef(null);

  const handleOnPress = event => {
    const loc = event.geometry.coordinates;
    camera.current?.moveTo(loc, 200);
  };

  const getDirections = async () => {
    const direction = await MapAPi.getDirections({
      vehicle: 'car',
      origin: currentLocation,
      destination: locations,
    });
    const decodePolyline = encoded => {
      const decoded = polyline.decode(encoded);
      return decoded.map(point => ({
        latitude: point[0],
        longitude: point[1],
      }));
    };
    const coordinates = decodePolyline(
      direction.routes[0].overview_polyline.points,
    );
    setRoute(coordinates);
  };

  const updateSearch = search => {
    setSearch(search);
    setIsShowLocation(true);
    if (search.length >= 5) {
      getPlacesAutocomplete();
    }
  };

  const _handleSubmit = async item => {
    let placeDetail = await MapAPi.getPlaceDetail({
      place_id: item.item.place_id,
    });
    // setCurrentLocation([placeDetail.result.geometry.location.lng,placeDetail.result.geometry.location.lat])
    setLocations([
      placeDetail.result.geometry.location.lng,
      placeDetail.result.geometry.location.lat,
    ]);
    setZoomlevel(14);
  };

  const renderHeader = () => {
    return (
      <View style={{...styles.toolbar}}>
        <View></View>
        <Text style={{...styles.toolbarTitle}}>Home</Text>
        <View />
      </View>
    );
  };

  const renderItem = item => {
    return (
      <TouchableOpacity
        onPress={() => {
          setSearch(item.item.description);
          setIsShowLocation(false);
          _handleSubmit(item);
        }}
        style={{paddingLeft: 8}}>
        <View style={styles.itemSelect}>
          <Icon
            name="location-outline"
            type="ionicon"
            color={'#959498'}
            size={12}
          />
          <Text>{item.item.description}</Text>
          <View></View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaInsetsContext.Consumer>
      {insets => (
        <>
          <GeneralStatusBar
            backgroundColor={'transparent'}
            barStyle="transparent"
          />
          <SafeAreaView
            style={{
              backgroundColor: '#0E4E9B',
              paddingTop: 0,
              paddingBottom: Platform.OS == 'ios' ? -48 : 0,
            }}>
            {renderHeader()}
          </SafeAreaView>

          <View style={{flex: 1}}>
            <View style={{flex: 1}}>
              <MapLibreGL.MapView
                styleURL={loadMap}
                onPress={handleOnPress}
                style={{flex: 1}}
                projection="globe"
                zoomEnabled={true}>
                <MapLibreGL.Camera
                  ref={camera}
                  zoomLevel={zoomLevel}
                  centerCoordinate={
                    locations.length > 0 ? locations : currentLocation
                  }
                />
                <MapLibreGL.PointAnnotation
                  id="pointDirect"
                  key="0909"
                  draggable={true}
                  coordinate={currentLocation} // Tọa độ marker 1
                ></MapLibreGL.PointAnnotation>
                {locations.length > 0 ? (
                  <MapLibreGL.PointAnnotation
                    id="marker1"
                    coordinate={locations} // Tọa độ marker 1
                  ></MapLibreGL.PointAnnotation>
                ) : null}

                {route.length > 0 ? (
                  <MapLibreGL.ShapeSource
                    id="lineSource"
                    shape={{
                      type: 'Feature',
                      geometry: {
                        type: 'LineString',
                        coordinates: route.map(coord => [
                          coord.longitude,
                          coord.latitude,
                        ]),
                      },
                    }}>
                    <MapLibreGL.LineLayer
                      id="lineLayer"
                      style={{
                        lineColor: '#2E64FE',
                        lineWidth: 10,
                        lineCap: 'round', // Thêm thuộc tính lineCap
                        lineJoin: 'round', // Thêm thuộc tính lineJoin
                      }}
                    />
                  </MapLibreGL.ShapeSource>
                ) : null}
              </MapLibreGL.MapView>
              <View style={styles.containerInput}>
                <View>
                  <SearchBar
                    placeholder={'Nhập đia điểm'}
                    onChangeText={updateSearch}
                    lightTheme={true}
                    value={search}
                    inputContainerStyle={styles.searchInputContainer}
                    inputStyle={styles.textSearchInput}
                    containerStyle={styles.searchContainer}
                  />
                </View>
              </View>
              <View
                style={{
                  position: 'absolute',
                  top: 2,
                  right: 2,
                }}>
                <TouchableOpacity
                  style={{
                    width: 80,
                    height: 48,
                    backgroundColor: 'blue',
                    alignItems: 'center',
                  }}
                  onPress={() => getDirections()}>
                  <Text style={{color: 'white', paddingVertical: 8}}>
                    Dẫn đường
                  </Text>
                </TouchableOpacity>
              </View>
              {isShowLocation ? (
                <View
                  style={{
                    position: 'absolute',
                    top: 64,
                    left: 0,
                    width: windowWidth,
                    backgroundColor: '#FFFF',
                  }}>
                  <FlatList data={description} renderItem={renderItem} />
                </View>
              ) : null}
            </View>
          </View>
        </>
      )}
    </SafeAreaInsetsContext.Consumer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  containerInput: {
    position: 'absolute',
    top: 2,
    left: 0,
    width: windowWidth - 98,
    borderColor: '#E0E0E0',
    borderWidth: 1,
    backgroundColor: '#FFFF',
  },
  backgroundContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  inputLng: {
    width: 74,
    height: 42,
    borderWidth: 1,
    borderColor: '#959498',
    borderRadius: 8,
    marginHorizontal: 8,
  },
  inputLat: {
    width: 74,
    height: 42,
    borderWidth: 1,
    borderColor: '#959498',
    borderRadius: 8,
  },
  searchInputContainer: {
    backgroundColor: '#FFFF',
    borderColor: '#FFFF',
  },
  textSearchInput: {
    fontSize: 10,
  },
  searchContainer: {
    padding: 0,
    backgroundColor: '#FFFF',
  },
  toolbar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    backgroundColor: '#0E4E9B',
    height: 48,
    borderBottomColor: '#e2e1e1',
    borderBottomWidth: 1,
  },
  toolbarTitle: {
    flexDirection: 'row',
    fontSize: 18,
    color: '#FFF',
  },
  icondirect: {
    width: 24,
    height: 24,
  },
  hitSlop: {
    top: 16,
    bottom: 16,
    left: 16,
    right: 16,
  },
  itemSelect: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginHorizontal: 8,
    alignItems: 'center',
  },
});

export default HomeScreen;