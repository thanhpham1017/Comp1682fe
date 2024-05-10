import Post from "../Post";
import React, { useEffect, useState, useContext, useRef } from "react";
import MapGL, {Marker, Source, Layer} from 'react-map-gl';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import {UserContext} from "../UserContext";
import { GeolocateControl } from 'react-map-gl';
import Dropzone from 'react-dropzone';
// import axios from "axios";
import { FaMapMarker,FaStar,FaTimes,FaDirections   } from 'react-icons/fa';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';
import '../css/IndexPage.css';
import 'react-toastify/dist/ReactToastify.css';
var socket;
const ENDPOINT = "https://comp1682be.onrender.com";
export default function IndexPage(){
  const [isAdmin, setIsAdmin] = useState(false); // Trạng thái lưu trữ vai trò của người dùng
  const [posts,setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pins, setPins] = useState([]);
  const [currentPlaceId, setCurrentPlaceId] = useState(null);
  const [selectedPin, setSelectedPin] = useState(null);
  const [newPlace, setNewPlace] = useState(null);
  const [title, setTitle] = useState(null);
  const [category, setCategory] = useState(null);
  const [desc, setDesc] = useState(null);
  const [price, setPrice] = useState(0);
  const [address, setAddress] = useState(0);
  const [star, setStar] = useState(0);
  const {userInfo } = useContext(UserContext);
  const [selectedMarkerInfo, setSelectedMarkerInfo] = useState(null);
  const [currentPinId, setCurrentPinId] = useState(null);
  const [image, setImage] = useState([]); 
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [comment, setComment] = useState(''); // Trạng thái lưu trữ nội dung comment mới
  const [comments, setComments] = useState([]); // Trạng thái lưu trữ tất cả các comment của địa điểm được chọn
  const [showDirections, setShowDirections] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [pinInfo,setPinInfo] = useState(null);
  const mapRef = useRef(); 
 // const [directionsLayer, setDirectionsLayer] = useState(null);
 const { notifications, setNotifications } = useContext(UserContext);
  const [directionsSource, setDirectionsSource] = useState(null);
  const [viewport, setViewport] = useState({
    zoom: 10,
  });
  const GeolocateController = useRef();
  const [isMarkerSelected, setIsMarkerSelected] = useState(false);
  const [previousRating, setPreviousRating] = useState(0); 
  const [searchTerm, setSearchTerm] = useState("");// Đánh giá trước đó

  useEffect(() => {
    // Kiểm tra xem người dùng có vai trò là admin hay không
    if (userInfo && userInfo.role === 'Admin') {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  }, [userInfo]);

  useEffect(() => {
      fetch('https://comp1682be.onrender.com/post').then(reponse => {
          reponse.json().then(posts => {
              setPosts(posts);
          });
      });
  }, []);

  useEffect(() => {
    // const savedComments = localStorage.getItem('comments');
    // if (savedComments) {
    //   setComments(JSON.parse(savedComments));
    // } else {
    //   setComments([]); // Ensure comments is always an array
    // }
  
    const getPins = async () => {
      try {    
        const response = await fetch("https://comp1682be.onrender.com/pins");
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const pinsData = await response.json();
        setPins(pinsData);
      } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
      }
    };
    getPins();
  
    GeolocateControl.current?.trigger()
  }, [currentPlaceId, pins, viewport, GeolocateController]);
  
  

  const handleMarkerClick = (id, lat, long) => {
    setSelectedPin(pins.find(pin => pin._id === id));
    setCurrentPlaceId(id);
    setViewport({ ...viewport, latitude: lat, longitude: long });
    setSelectedMarkerInfo(pins.find(pin => pin._id === id));
    setCurrentPinId(id); // Lưu id của pin hiện tại
    setIsMarkerSelected(true);
    //debugger;
    setCategory(pins.find(pin => pin._id === id).category.name); 
  }

  const handleAddClick = (e) => {
    const long = e.lngLat.lng;
    const lat = e.lngLat.lat;
    setNewPlace({
      lat,
      long,
    });
    const selectedCategory = categories.find(cat => cat._id === category);
    setCategory(selectedCategory ? selectedCategory.name : null);
  }

  const currentUserEmail = localStorage.getItem('userEmail');

  
  const handleImageDrop = (acceptedFiles) => {
    // Xử lý khi người dùng tải lên hình ảnh
    const files = acceptedFiles.map(file => {
        const reader = new FileReader();
        reader.onload = () => {
            setImage(prevImages => [...prevImages, reader.result]); // Thêm hình ảnh vào mảng trạng thái
        };
        reader.readAsDataURL(file);
        return file;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
      const newPin = {
      email : currentUserEmail,
      title,
      desc,
      category,
      rating: star,
      lat: newPlace.lat,
      long: newPlace.long,
      image: image,
      address:address
      };
    
      try {
        const response = await fetch("https://comp1682be.onrender.com/pinCreate", {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newPin),
          credentials: 'include',
        });
    
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
      } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
      }
  }

  useEffect(() => {
    const fetchPinInfo = async () => {
      try {
        if (currentPinId) {
          const response = await fetch(`https://comp1682be.onrender.com/pin/${currentPinId}`);
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          const pinData = await response.json();
          setPinInfo(pinData);
        }
      } catch (error) {
        console.error('There was a problem fetching pin info:', error);
      }
    };
  
    fetchPinInfo();
  }, [currentPinId]);
  
  useEffect(() => {
  }, [pinInfo]);

  useEffect(() => {
    if (!socket) {
      socket = io(ENDPOINT);
    }
    console.log(socket);
    // Hủy bỏ tất cả các lắng nghe trước đó
    socket.removeAllListeners();
    socket.on('new-comment', (newComment) => {
      console.log('New comment pins received:', newComment);
      setPinInfo(prevPinInfo => {
            if (!prevPinInfo) return null;
            return {
                ...prevPinInfo,
                comments: [...prevPinInfo.comments, newComment] // Assuming msg contains new comment data
            };
        });
    });
  }, []); 

  const addComment = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`https://comp1682be.onrender.com/pin/comment/${currentPinId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',  
        },
        body: JSON.stringify({ comment })
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      if (data.success === true) {
        
        socket.emit('comment', { text : comment });
        setComment('');
        // const updatedComments = [...comments, data.comment];
        // // Cập nhật state của comments với danh sách comments mới
        // setComments(updatedComments);
        toast.success("comment added");
      }
    } catch (error) {
      console.error('There was a problem with the fetch operation:', error);
      toast.error("There was a problem adding the comment");
    }
  };
  
  const fetchCategories = async () => {
    try {
        const response = await fetch('https://comp1682be.onrender.com/category', {
            credentials: 'include',
        });
        if (!response.ok) {
            throw new Error('Failed to fetch categories');
        }
        const data = await response.json();
        setCategories(data.data);
    } catch (error) {
        console.error('Error fetching categories:', error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCloseSidebar = () => {
    setIsMarkerSelected(false); // Đặt trạng thái marker đã được chọn là false khi người dùng đóng side bar
  };

  // const filterPinsByCategory = (categoryName) => {
  //   if (categoryName === "") {
  //     // Nếu người dùng chọn "Select a category", hiển thị tất cả các pins
  //     setPins(pins);
  //   } else {
  //     // Lọc pins dựa trên tên category
  //     const filteredPins = pins.filter(pin => pin.title.toLowerCase().includes(categoryName.toLowerCase()));
  //     setPins(filteredPins);
  //   }
  // };
  const filterPinsByCategory = (categoryId) => {
    if (!categoryId) {
      // Nếu không có categoryId được chọn, hiển thị tất cả các pins
      setPins(pins);
    } else {
      // Lọc pins dựa trên categoryId
      const filteredPins = pins.filter(pin => pin.category === categoryId);
      setPins(filteredPins);
    }
  };
  
  useEffect(() => {
    const previousRatingFromStorage = parseInt(localStorage.getItem('previousRating'));
    if (!isNaN(previousRatingFromStorage)) {
      setPreviousRating(previousRatingFromStorage);
    }
  }, []);

  const handleStarClick = async (rating) => {
    setUserRating(rating); // Cập nhật trạng thái đánh giá của người dùng
    localStorage.setItem('previousRating', rating);
    try {
      const response = await fetch(`https://comp1682be.onrender.com/pin/rate/${currentPinId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userRating: rating })
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      if (data.success) {
        toast.success("Rating added successfully");
        // Cập nhật lại số ngôi sao ngay lập tức sau khi người dùng đánh giá
        setUserRating(rating);
      }
    } catch (error) {
      console.error('There was a problem with the fetch operation:', error);
      toast.error("There was a problem adding the rating");
    }
  };
  
  

  const handleDirections = async () => {
    if (!selectedPin || !mapRef.current || !mapRef.current.getMap) return; // Kiểm tra xem có chọn điểm đánh dấu không và mapRef đã khởi tạo
    try {
      // Lấy tọa độ của điểm đích từ API GeoCoding của Mapbox
      const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${selectedPin.long},${selectedPin.lat}.json?access_token=pk.eyJ1IjoibmdvYzI4MDkiLCJhIjoiY2x1aWxkNmYzMDAyZDJsbzZzY3Frdjl3OCJ9.JGSMHnEz3QM9qrNq_s9vEw`);
      if (!response.ok) {
        throw new Error('Failed to fetch GeoCoding data');
      }
      const data = await response.json();
      
      // Kiểm tra xem dữ liệu có chứa các feature không
      if (!data.features || data.features.length === 0) {
        console.error('Không tìm thấy feature trong phản hồi API GeoCoding:', data);
        return;
      }
  
      // Lấy tọa độ của điểm đích từ dữ liệu phản hồi
      const destinationCoords = data.features[0].geometry.coordinates;
  
      // Lấy vị trí hiện tại của người dùng
      const userLocation = mapRef.current.getMap().getCenter();
  
      // Xây dựng URL để tạo hướng dẫn từ vị trí hiện tại của người dùng đến điểm đích được chọn
      const directionsURL = `https://api.mapbox.com/directions/v5/mapbox/driving/${userLocation.lng},${userLocation.lat};${destinationCoords[0]},${destinationCoords[1]}?steps=true&geometries=geojson&access_token=pk.eyJ1IjoibmdvYzI4MDkiLCJhIjoiY2x1aWxkNmYzMDAyZDJsbzZzY3Frdjl3OCJ9.JGSMHnEz3QM9qrNq_s9vEw`;
  
      // Lấy dữ liệu hướng dẫn từ API Directions của Mapbox
      const directionsResponse = await fetch(directionsURL);
      if (!directionsResponse.ok) {
        throw new Error('Failed to fetch Directions data');
      }
      const directionsData = await directionsResponse.json();
  
      // Giải mã hình học của đường nét sử dụng hàm fromGeoJSON
      // const polyline = require('@mapbox/polyline');
      const decodedGeometry = directionsData.routes[0].geometry.coordinates;
      // Tạo một đối tượng GeoJSON chứa hình học đường nét được giải mã
      const geojson = {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: decodedGeometry,
        },
      };
      console.log('geojson:', geojson);
      // Tạo một lớp và nguồn để hiển thị hướng dẫn trên bản đồ
      const directionsLayer = {
        id: 'directions',
        type: 'line',
        source: {
          type: 'geojson',
          data: geojson,
        },
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#6495ED',
          'line-width': 5,
        },
      };
      const map = mapRef.current.getMap();

      // Add the directions layer to the map
      map.on('load', function () {
        if (map.getSource('directions')) {
          map.removeSource('directions');
          map.removeLayer('directions');
        }
      
        map.addSource('directions', {
          type: 'geojson',
          data: geojson,
        });
      
        map.addLayer(directionsLayer);
        setShowDirections(!showDirections);
      });

      // Cập nhật nguồn hướng dẫn trên bản đồ
      setDirectionsSource(directionsLayer);
    } catch (error) {
      console.error('Lỗi khi lấy hướng dẫn:', error);
    }
  };  

  const handleSearch = async () => {
    try {
      // Gửi yêu cầu tìm kiếm đến máy chủ
      const response = await fetch(`https://comp1682be.onrender.com/search?title=${searchTerm}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      // Nhận kết quả tìm kiếm từ máy chủ
      const searchData = await response.json();
      // Cập nhật danh sách pin trên bản đồ với kết quả tìm kiếm
      setPins(searchData);
    } catch (error) {
      console.error('There was a problem with the search operation:', error);
    }
  };
  
  // Xử lý sự kiện nhập phím để thực hiện tìm kiếm khi người dùng ấn phím Enter
  const handleKeyPress = (e) => {
    // Kiểm tra xem phím mà người dùng ấn có phải là phím Enter không (mã phím 13)
    if (e.key === 'Enter') {
      // Thực hiện hành động tìm kiếm
      handleSearch();
    }
  };

  
  return(
    <div style={{position: "relative"}}>
        <div className="select-wrapper">
          <select onChange={(e) => filterPinsByCategory(e.target.value)}>
            <option value="">Select a category</option>
            {categories.map(category => (
              <option key={category._id} value={category._id}>{category.name}</option>
            ))}
          </select>
        </div>
        <div className="input-box">
          <i className="uil uil-search"></i>
          <input
            type="text"
            placeholder="Search here..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyPress}
          />
          <button className="button" onClick={handleSearch}>Search</button>
        </div>
        <MapGL
          ref={mapRef}
          // mapRef={mapRef}
          mapboxAccessToken={process.env.REACT_APP_MAPBOX}
          initialViewState={{
            ...viewport
          }}
          style={{width: "100%", height: "700px", marginTop: "30px"}}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          onDblClick={handleAddClick}
          transitionDuration="200"
        >
          {directionsSource && (
          <Source id="directions" type="geojson" data={directionsSource.source.data}>
            <Layer {...directionsSource} />
          </Source>
          )}
          {/* {!showDirections && ( */}
          <button onClick={handleDirections} style={{ position: "absolute", top: "10px", left: "10px", zIndex: 1000 }}>
            <FaDirections style={{ fontSize: "40px", color: "Gray" }} />
          </button>
          {/* )} */}
          <GeolocateControl positionOptions={{ enableHighAccuracy: true }} trackUserLocation={true} ref={GeolocateController} />
          {pins.map(p => (
            <Marker 
              longitude={p.long} 
              latitude={p.lat} 
              anchor="bottom" 
              key={p._id}
            >
              <FaMapMarker 
                style={{
                  fontSize: 300 / viewport.zoom,
                  color:"red",
                  cursor: "pointer",
                }}
                onClick={() => handleMarkerClick(p._id,p.lat,p.long) }
              />
            </Marker>
          ))}
          {newPlace && (
            <div className="sidebar" style={{position: "absolute", top: 0, right: 0, width: "460px", height: "500px", backgroundColor: "#fff", boxShadow: "-2px 0 5px rgba(0, 0, 0, 0.1)", zIndex: 1000, overflowY: "auto"}}>
              <button onClick={() => setNewPlace(null)} style={{background: "none", border: "none", cursor: "pointer", position: "absolute", top: "10px", right: "10px"}}>
                <FaTimes style={{fontSize: "1.5rem"}} />
              </button>
              <form onSubmit={handleSubmit}>
                <div className="formCard">
                  <label>Name:</label><br />
                  <input 
                    className="formInput" 
                    placeholder="Enter name" 
                    onChange={(e) => setTitle(e.target.value)}
                  /><br />
                  <label>Review:</label><br />
                  <textarea className="formInput" 
                    placeholder="Say something about this place"
                    onChange={(e) => setDesc(e.target.value)}
                  ></textarea><br />
                  <label>Address:</label><br />
                  <textarea className="formInput" 
                    placeholder="Address"
                    onChange={(e) => setAddress(e.target.value)}
                  ></textarea><br />
                  <label>Category:</label><br />
                  <select
                    className="formInput"
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="">Select a category</option>
                    {categories.map(category => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select><br />
                  <Dropzone onDrop={handleImageDrop} accept="image/*" multiple={true}>
                    {({ getRootProps, getInputProps }) => (
                        <div {...getRootProps()} style={{ cursor: 'pointer', border: '1px dashed #ccc', padding: '20px', textAlign: 'center' }}>
                            <input {...getInputProps()} />
                            {image.length > 0 ? (
                                <div>
                                    <img src={image[currentImageIndex]} alt={`Selected ${currentImageIndex}`} style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', marginBottom: '10px' }} />
                                    {image.length > 1 && (
                                        <div>
                                            <button onClick={() => setCurrentImageIndex((prevIndex) => (prevIndex === 0 ? image.length - 1 : prevIndex - 1))}>Previous</button>
                                            <button onClick={() => setCurrentImageIndex((prevIndex) => (prevIndex === image.length - 1 ? 0 : prevIndex + 1))}>Next</button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p>Drag 'n' drop images here, or click to select images</p>
                            )}
                        </div>
                    )}
                  </Dropzone>
                  <label>Rating:</label><br />
                  <select className="formInput" onChange={(e) => setStar(e.target.value)}>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                  </select><br />
                  <button className="formSubmitButton" type="submit">Add Pin</button><br />
                </div>
              </form>
            </div>
          )}
        </MapGL>
        {/* {console.log(selectedMarkerInfo)} */}
        {selectedMarkerInfo && isMarkerSelected &&(
          <div className="sidebar" style={{position: "absolute", top: 0, right: 0, width: "400px", height: "650px", backgroundColor: "#fff", boxShadow: "-2px 0 5px rgba(0, 0, 0, 0.1)", zIndex: 1000, overflowY: "auto", marginTop: "75px"}}>
            <button onClick={handleCloseSidebar} style={{background: "none", border: "none", cursor: "pointer", position: "absolute", top: "0", right: "0px"}}>
              <FaTimes style={{fontSize: "1.5rem"}} />
            </button>
            {selectedMarkerInfo && (
              <div className="marker-info">
                <div className="arrow-buttons">
                  <button className="left-arrow" onClick={() => setCurrentImageIndex((prevIndex) => (prevIndex === 0 ? selectedMarkerInfo.image.length - 1 : prevIndex - 1))}>
                    <FaChevronLeft style={{}} />
                  </button>
                  <img src={selectedMarkerInfo.image[currentImageIndex]} alt="Marker" className="marker-image" />
                  <button className="right-arrow" onClick={() => setCurrentImageIndex((prevIndex) => (prevIndex === selectedMarkerInfo.image.length - 1 ? 0 : prevIndex + 1))}>
                    <FaChevronRight style={{}} />
                  </button>
                </div>
                <h2>{selectedMarkerInfo.title}</h2>
                <p>{selectedMarkerInfo.desc}</p>
                {/* <p>Category: {selectedMarkerInfo.category.name}</p> */}
                <div>
                  <div className="previous-ratings">
                    {[...Array(previousRating)].map((_, index) => (
                      <FaStar key={index} className="star" />
                    ))}
                  </div>
                  {/* <label>Rating: {selectedMarkerInfo.rating}</label><br /> */}
                  {/* Hiển thị dropdown để chọn số sao mới */}
                  <select className="formInput" value={userRating} onChange={(e) => handleStarClick(parseInt(e.target.value))}>
                    <option value="0">Select a rating</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                  </select>
                  <br />
                </div>
                <p>Posted by: {selectedMarkerInfo.email}</p>
                {/* Form để thêm comment */}
                <form onSubmit={addComment}>
                  <textarea
                    className="formInput"
                    placeholder="Leave a comment..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  ></textarea>
                  <button className="formSubmitButton" type="submit">Comment</button>
                </form>   
                {pinInfo && pinInfo.comments && pinInfo.comments.map((comment, index) => (
                    <div key={index} className="comment">
                        <p>Comment: {comment.text}</p>
                        
                    </div>
                ))}
              </div>
            )}
          </div>
        )}
        <h1>Blog</h1>
        <div className="post-wrapper">
          {posts.length > 0 && posts.map((post) => (
            <Post key={post.id} {...post} />
          ))}
        </div>
    </div>
  );
}