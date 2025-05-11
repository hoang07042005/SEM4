import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './BookingPassenger.css';
import { toast } from 'react-toastify';

const BookingPassenger = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { bookingId, tourInfo, selectedDate, discountCode } = location.state || {};

    const [useLoggedInInfo, setUseLoggedInInfo] = useState(true);
    const [contactInfo, setContactInfo] = useState({
        fullName: '',
        phoneNumber: '',
        email: '',
        address: ''
    });
    
    const [loggedInUser, setLoggedInUser] = useState({
        fullName: 'John Doe', // This should come from your auth context
        phoneNumber: '0123456789',
        email: 'john@example.com',
        address: 'Sample Address'
    });
    

    const [passengers, setPassengers] = useState({
        adult: 1,
        child: 0,
        infant: 0
    });

    const [passengerDetails, setPassengerDetails] = useState({
        adult: [],
        child: [],
        infant: []
    });

    // Add new state for tour info
    const [bookedTour, setBookedTour] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (useLoggedInInfo) {
            setContactInfo(loggedInUser);
        }
    }, [useLoggedInInfo]);

    useEffect(() => {
        // Redirect if no booking info
        if (!bookingId || !tourInfo) {
            navigate('/tours');
            return;
        }
        
        setBookedTour(tourInfo);
        
        // Fetch logged in user info
        const fetchUserInfo = async () => {
            try {
                const token = localStorage.getItem('token');
                const userId = localStorage.getItem('userId');
                if (!token || !userId) {
                    navigate('/login');
                    return;
                }

                const response = await axios.get(`http://localhost:8080/api/users/${userId}`, {
                    headers: { 
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.data) {
                    const userData = {
                        fullName: response.data.fullName || '',
                        phoneNumber: response.data.phone || '',
                        email: response.data.email || '',
                        address: response.data.address || ''
                    };
                    
                    setLoggedInUser(userData);
                    setContactInfo(userData);
                }
            } catch (error) {
                console.error('Error fetching user info:', error);
                if (error.response?.status === 401) {
                    navigate('/login');
                }
            }
        };

        fetchUserInfo();
    }, [bookingId, tourInfo, navigate]);

    const handleContactChange = (e) => {
        setContactInfo({
            ...contactInfo,
            [e.target.name]: e.target.value
        });
    };

    const handlePassengerChange = (type, operation) => {
        setPassengers(prev => {
            const newValue = operation === 'add' 
                ? prev[type] + 1 
                : Math.max(0, prev[type] - 1);
            
            if (type === 'adult' && newValue < 1) return prev;
            if (newValue < 0) return prev;
            
            // Update passenger details array
            setPassengerDetails(prevDetails => {
                const details = [...prevDetails[type]];
                if (operation === 'add') {
                    details.push({
                        fullName: '',
                        gender: 'Nam',
                        birthDate: '',
                        passengerType: type
                    });
                } else if (operation === 'subtract' && details.length > 0) {
                    details.pop();
                }
                return { ...prevDetails, [type]: details };
            });

            return {
                ...prev,
                [type]: newValue
            };
        });
    };

    const handlePassengerDetailChange = (type, index, field, value) => {
        setPassengerDetails(prev => {
            const updated = [...prev[type]];
            updated[index] = { ...updated[index], [field]: value };
            return { ...prev, [type]: updated };
        });
    };

    const handleToggleUserInfo = () => {
        if (!useLoggedInInfo) {
            setContactInfo(loggedInUser);
        } else {
            setContactInfo({
                fullName: '',
                phoneNumber: '',
                email: '',
                address: ''
            });
        }
        setUseLoggedInInfo(!useLoggedInInfo);
    };

    const handleSubmitPassengers = async () => {
        try {
            // Validate form
            const errors = [];
            if (!contactInfo.fullName?.trim()) errors.push("Họ tên không được để trống");
            if (!contactInfo.email?.trim()) errors.push("Email không được để trống");
            if (!contactInfo.phoneNumber?.trim()) errors.push("Số điện thoại không được để trống");
            
            if (errors.length > 0) {
                errors.forEach(error => toast.error(error));
                return;
            }

            setIsSubmitting(true);
            const token = localStorage.getItem('token');
            const userId = localStorage.getItem('userId');

            if (!token || !userId) {
                navigate('/login');
                return;
            }

            // Prepare all passenger details
            const allPassengers = [];
            
            // Add contact info as first adult passenger
            if (passengerDetails.adult.length > 0) {
                allPassengers.push({
                    fullName: contactInfo.fullName,
                    gender: passengerDetails.adult[0]?.gender || 'Nam',
                    birthDate: passengerDetails.adult[0]?.birthDate || '',
                    passengerType: 'adult'
                });

                // Add remaining adult passengers
                for (let i = 1; i < passengerDetails.adult.length; i++) {
                    const passenger = passengerDetails.adult[i];
                    if (!passenger.fullName) {
                        toast.error(`Vui lòng nhập tên cho Người lớn ${i + 1}`);
                        return;
                    }
                    allPassengers.push({ ...passenger, passengerType: 'adult' });
                }
            }

            // Add child passengers
            passengerDetails.child.forEach((passenger, index) => {
                if (!passenger.fullName) {
                    toast.error(`Vui lòng nhập tên cho Trẻ em ${index + 1}`);
                    return;
                }
                allPassengers.push({ ...passenger, passengerType: 'child' });
            });

            // Add infant passengers
            passengerDetails.infant.forEach((passenger, index) => {
                if (!passenger.fullName) {
                    toast.error(`Vui lòng nhập tên cho Em bé ${index + 1}`);
                    return;
                }
                allPassengers.push({ ...passenger, passengerType: 'infant' });
            });

            const passengersData = {
                bookingId: parseInt(bookingId),
                userId: parseInt(userId),
                contactInfo: {
                    fullName: contactInfo.fullName.trim(),
                    phoneNumber: contactInfo.phoneNumber.trim(),
                    email: contactInfo.email.trim(),
                    address: contactInfo.address?.trim() || ''
                },
                passengers: {
                    adult: parseInt(passengers.adult),
                    child: parseInt(passengers.child),
                    infant: parseInt(passengers.infant)
                },
                passengerDetails: allPassengers
            };

            console.log('Submitting passenger data:', passengersData);

            const response = await axios.post(
                'http://localhost:8080/api/booking-passengers/submit',
                passengersData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data) {
                toast.success('Đăng ký thông tin hành khách thành công!');
                navigate('/momo-payment', { 
                    state: { 
                        bookingId,
                        passengers: response.data,
                        tourInfo: bookedTour
                    } 
                });
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || 
                               'Đã có lỗi xảy ra khi đăng ký thông tin hành khách';
            toast.error(errorMessage);
            console.error('Error submitting passengers:', error.response?.data || error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderPassengerForms = (type, count, typeLabel) => {
        return Array.from({ length: count }).map((_, index) => {
            // For first adult passenger, use contact info
            if (type === 'adult' && index === 0) {
                return (
                    <div key={`${type}-${index}`} className="passenger-form">
                        <h4>{typeLabel} {index + 1} (Thông tin liên hệ)</h4>
                        <div className="passenger-form-fields">
                            <div className="form-group">
                                <label>Họ tên</label>
                                <input
                                    type="text"
                                    value={contactInfo.fullName}
                                    disabled
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Giới tính</label>
                                    <select
                                        value={passengerDetails[type][index]?.gender || 'Nam'}
                                        onChange={(e) => handlePassengerDetailChange(type, index, 'gender', e.target.value)}
                                    >
                                        <option value="Nam">Nam</option>
                                        <option value="Nữ">Nữ</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Ngày sinh</label>
                                    <input
                                        type="date"
                                        value={passengerDetails[type][index]?.birthDate || ''}
                                        onChange={(e) => handlePassengerDetailChange(type, index, 'birthDate', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                );
            }

            // For other passengers
            return (
                <div key={`${type}-${index}`} className="passenger-form">
                    <h4>{typeLabel} {index + 1}</h4>
                    <div className="passenger-form-fields">
                        <div className="form-group">
                            <label>Họ tên <span className="required">*</span></label>
                            <input
                                type="text"
                                value={passengerDetails[type][index]?.fullName || ''}
                                onChange={(e) => handlePassengerDetailChange(type, index, 'fullName', e.target.value)}
                                placeholder="Nhập họ tên"
                                required
                            />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Giới tính</label>
                                <select
                                    value={passengerDetails[type][index]?.gender || 'Nam'}
                                    onChange={(e) => handlePassengerDetailChange(type, index, 'gender', e.target.value)}
                                >
                                    <option value="Nam">Nam</option>
                                    <option value="Nữ">Nữ</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Ngày sinh</label>
                                <input
                                    type="date"
                                    value={passengerDetails[type][index]?.birthDate || ''}
                                    onChange={(e) => handlePassengerDetailChange(type, index, 'birthDate', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            );
        });
    };

    return (
        <div className="booking-form">
            {/* Add Booked Tour Summary */}
            {bookedTour && (
                <div className="booked-tour-summary">
                    <h2>THÔNG TIN TOUR ĐÃ ĐẶT</h2>
                    <div className="tour-summary">
                        <div className="tour-image">
                            <img 
                                src={`http://localhost:8080${bookedTour.imageUrl}`} 
                                alt={bookedTour.name} 
                            />
                        </div>
                        <div className="tour-details">
                            <h3>{bookedTour.name}</h3>
                            <p>Ngày khởi hành: {new Date(selectedDate).toLocaleDateString('vi-VN')}</p>
                            <p>Giá: {bookedTour.price.toLocaleString()}đ</p>
                            {discountCode && <p>Mã giảm giá: {discountCode}</p>}
                            <p>Mã đặt tour: {bookingId}</p>
                        </div>
                    </div>
                </div>
            )}

            <h2>THÔNG TIN LIÊN LẠC</h2>
            <div className="contact-info">
                <div className="use-logged-in-toggle">
                    <label className="toggle-switch">
                        <input
                            type="checkbox"
                            checked={useLoggedInInfo}
                            onChange={handleToggleUserInfo}
                        />
                        <span className="toggle-slider"></span>
                    </label>
                    <span>Sử dụng thông tin tài khoản đang đăng nhập</span>
                </div>

                <div className="form-group">
                    <label>Họ tên <span className="required">*</span></label>
                    <input 
                        type="text"
                        name="fullName"
                        placeholder="Liên hệ"
                        value={contactInfo.fullName}
                        onChange={handleContactChange}
                        disabled={useLoggedInInfo}
                    />
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label>Email <span className="required">*</span></label>
                        <input 
                            type="email"
                            name="email"
                            placeholder="Nhập email"
                            value={contactInfo.email}
                            onChange={handleContactChange}
                            disabled={useLoggedInInfo}
                        />
                    </div>
                    <div className="form-group">
                        <label>Điện thoại <span className="required">*</span></label>
                        <input 
                            type="tel"
                            name="phoneNumber"
                            placeholder="Nhập số điện thoại"
                            value={contactInfo.phoneNumber}
                            onChange={handleContactChange}
                            disabled={useLoggedInInfo}
                        />
                    </div>
                </div>
                <div className="form-group">
                    <label>Địa chỉ</label>
                    <input 
                        type="text"
                        name="address"
                        placeholder="Nhập địa chỉ"
                        value={contactInfo.address}
                        onChange={handleContactChange}
                        disabled={useLoggedInInfo}
                    />
                </div>
            </div>

            <h2>HÀNH KHÁCH</h2>
            <div className="passenger-types">
                <div className="passenger-counter">
                    <div className="passenger-label">
                        <span>Người lớn</span>
                        <small>Từ 12 tuổi trở lên</small>
                    </div>
                    <div className="counter-controls">
                        <button onClick={() => handlePassengerChange('adult', 'subtract')}>-</button>
                        <span>{passengers.adult}</span>
                        <button onClick={() => handlePassengerChange('adult', 'add')}>+</button>
                    </div>
                </div>

                <div className="passenger-counter">
                    <div className="passenger-label">
                        <span>Trẻ em</span>
                        <small>Từ 2 - 11 tuổi</small>
                    </div>
                    <div className="counter-controls">
                        <button onClick={() => handlePassengerChange('child', 'subtract')}>-</button>
                        <span>{passengers.child}</span>
                        <button onClick={() => handlePassengerChange('child', 'add')}>+</button>
                    </div>
                </div>

                <div className="passenger-counter">
                    <div className="passenger-label">
                        <span>Em bé</span>
                        <small>Dưới 2 tuổi</small>
                    </div>
                    <div className="counter-controls">
                        <button onClick={() => handlePassengerChange('infant', 'subtract')}>-</button>
                        <span>{passengers.infant}</span>
                        <button onClick={() => handlePassengerChange('infant', 'add')}>+</button>
                    </div>
                </div>
            </div>

            <div className="passenger-details">
                {passengers.adult > 0 && (
                    <div className="passenger-type-section">
                        <h3>Người lớn</h3>
                        {renderPassengerForms('adult', passengers.adult, 'Người lớn')}
                    </div>
                )}
                
                {passengers.child > 0 && (
                    <div className="passenger-type-section">
                        <h3>Trẻ em</h3>
                        {renderPassengerForms('child', passengers.child, 'Trẻ em')}
                    </div>
                )}
                
                {passengers.infant > 0 && (
                    <div className="passenger-type-section">
                        <h3>Em bé</h3>
                        {renderPassengerForms('infant', passengers.infant, 'Em bé')}
                    </div>
                )}
            </div>

            <div className="submit-section">
                <button 
                    className="submit-button"
                    onClick={handleSubmitPassengers}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Đang xử lý...' : 'Xác nhận thông tin hành khách'}
                </button>
            </div>
        </div>
    );
};

export default BookingPassenger;
