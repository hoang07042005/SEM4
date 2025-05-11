    // BookingPassenger.js
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
        const [contactInfo, setContactInfo] = useState({ fullName: '', phoneNumber: '', email: '', address: '' });
        const [loggedInUser, setLoggedInUser] = useState({
            fullName: '', phoneNumber: '', email: '', address: ''
        });

        const [passengers, setPassengers] = useState({ adult: 1, child: 0, infant: 0 });
        const [passengerDetails, setPassengerDetails] = useState({ adult: [], child: [], infant: [] });
        const [bookedTour, setBookedTour] = useState(null);
        const [isSubmitting, setIsSubmitting] = useState(false);

        useEffect(() => {
            if (useLoggedInInfo) setContactInfo(loggedInUser);
        }, [useLoggedInInfo]);

        useEffect(() => {
            if (!bookingId || !tourInfo) return navigate('/tours');
            setBookedTour(tourInfo);

            const fetchUserInfo = async () => {
                try {
                    const token = localStorage.getItem('token');
                    const userId = localStorage.getItem('userId');
                    if (!token || !userId) return navigate('/login');

                    const res = await axios.get(`http://localhost:8080/api/users/${userId}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const data = res.data;
                    const userData = {
                        fullName: data.fullName || '',
                        phoneNumber: data.phone || '',
                        email: data.email || '',
                        address: data.address || ''
                    };
                    setLoggedInUser(userData);
                    setContactInfo(userData);
                } catch (err) {
                    console.error(err);
                    if (err.response?.status === 401) navigate('/login');
                }
            };
            fetchUserInfo();
        }, [bookingId, tourInfo, navigate]);

        const handleContactChange = (e) => {
            setContactInfo({ ...contactInfo, [e.target.name]: e.target.value });
        };

        const handlePassengerChange = (type, op) => {
            setPassengers(prev => {
                const newVal = op === 'add' ? prev[type] + 1 : Math.max(0, prev[type] - 1);
                if (type === 'adult' && newVal < 1) return prev;

                setPassengerDetails(prevDetails => {
                    const details = [...prevDetails[type]];
                    if (op === 'add') {
                        details.push({ fullName: '', gender: 'Nam', birthDate: '', passengerType: type });
                    } else if (op === 'subtract' && details.length > 0) {
                        details.pop();
                    }
                    return { ...prevDetails, [type]: details };
                });

                return { ...prev, [type]: newVal };
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
            setUseLoggedInInfo(prev => {
                if (!prev) setContactInfo(loggedInUser);
                else setContactInfo({ fullName: '', phoneNumber: '', email: '', address: '' });
                return !prev;
            });
        };

        const handleSubmitPassengers = async () => {
            const errors = [];
            if (!contactInfo.fullName?.trim()) errors.push("Họ tên không được để trống");
            if (!contactInfo.email?.trim()) errors.push("Email không được để trống");
            if (!contactInfo.phoneNumber?.trim()) errors.push("Số điện thoại không được để trống");
            if (errors.length > 0) return errors.forEach(err => toast.error(err));

            try {
                setIsSubmitting(true);
                const token = localStorage.getItem('token');
                const userId = localStorage.getItem('userId');
                if (!token || !userId) return navigate('/login');

                const allPassengers = [];
                if (passengerDetails.adult.length > 0) {
                    allPassengers.push({
                        fullName: contactInfo.fullName,
                        gender: passengerDetails.adult[0]?.gender || 'Nam',
                        birthDate: passengerDetails.adult[0]?.birthDate || '',
                        passengerType: 'adult'
                    });
                    for (let i = 1; i < passengerDetails.adult.length; i++) {
                        const p = passengerDetails.adult[i];
                        if (!p.fullName) return toast.error(`Vui lòng nhập tên cho Người lớn ${i + 1}`);
                        allPassengers.push({ ...p, passengerType: 'adult' });
                    }
                }
                passengerDetails.child.forEach((p, i) => {
                    if (!p.fullName) return toast.error(`Vui lòng nhập tên cho Trẻ em ${i + 1}`);
                    allPassengers.push({ ...p, passengerType: 'child' });
                });
                passengerDetails.infant.forEach((p, i) => {
                    if (!p.fullName) return toast.error(`Vui lòng nhập tên cho Em bé ${i + 1}`);
                    allPassengers.push({ ...p, passengerType: 'infant' });
                });

                const payload = {
                    bookingId: parseInt(bookingId),
                    userId: parseInt(userId),
                    contactInfo: {
                        fullName: contactInfo.fullName.trim(),
                        phoneNumber: contactInfo.phoneNumber.trim(),
                        email: contactInfo.email.trim(),
                        address: contactInfo.address?.trim() || ''
                    },
                    passengers: {
                        adult: passengers.adult,
                        child: passengers.child,
                        infant: passengers.infant
                    },
                    passengerDetails: allPassengers
                };

                const res = await axios.post('http://localhost:8080/api/booking-passengers/submit', payload, {
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
                });

                toast.success('Đăng ký thông tin hành khách thành công!');
                navigate('/momo-payment', {
                    state: { bookingId, passengers: res.data, tourInfo: bookedTour }
                });
            } catch (err) {
                const msg = err.response?.data?.message || 'Đã có lỗi xảy ra khi đăng ký thông tin hành khách';
                toast.error(msg);
                console.error(err);
            } finally {
                setIsSubmitting(false);
            }
        };

        return (
            <div className="booking-form">
                {bookedTour && (
                    <div className="booked-tour-summary">
                        <h2>THÔNG TIN TOUR ĐÃ ĐẶT</h2>
                        <div className="tour-summary">
                            <div className="tour-image">
                                <img src={`http://localhost:8080${bookedTour.imageUrl}`} alt={bookedTour.name} />
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
                            <input type="checkbox" checked={useLoggedInInfo} onChange={handleToggleUserInfo} />
                            <span className="toggle-slider"></span>
                        </label>
                        <span>Sử dụng thông tin tài khoản đang đăng nhập</span>
                    </div>

                    <div className="form-group">
                        <label>Họ tên *</label>
                        <input type="text" name="fullName" value={contactInfo.fullName} onChange={handleContactChange} disabled={useLoggedInInfo} />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Email *</label>
                            <input type="email" name="email" value={contactInfo.email} onChange={handleContactChange} disabled={useLoggedInInfo} />
                        </div>
                        <div className="form-group">
                            <label>Điện thoại *</label>
                            <input type="tel" name="phoneNumber" value={contactInfo.phoneNumber} onChange={handleContactChange} disabled={useLoggedInInfo} />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Địa chỉ</label>
                        <input type="text" name="address" value={contactInfo.address} onChange={handleContactChange} disabled={useLoggedInInfo} />
                    </div>
                </div>

                <h2>HÀNH KHÁCH</h2>
                {['adult', 'child', 'infant'].map(type => (
                    <div key={type} className="passenger-counter">
                        <div className="passenger-label">
                            <span>{type === 'adult' ? 'Người lớn' : type === 'child' ? 'Trẻ em' : 'Em bé'}</span>
                        </div>
                        <div className="counter-controls">
                            <button onClick={() => handlePassengerChange(type, 'subtract')}>-</button>
                            <span>{passengers[type]}</span>
                            <button onClick={() => handlePassengerChange(type, 'add')}>+</button>
                        </div>
                    </div>
                ))}

                {['adult', 'child', 'infant'].map(type => (
                    passengers[type] > 0 && (
                        <div className="passenger-type-section" key={type}>
                            <h3>{type === 'adult' ? 'Người lớn' : type === 'child' ? 'Trẻ em' : 'Em bé'}</h3>
                            {Array.from({ length: passengers[type] }).map((_, i) => (
                                <div className="passenger-form" key={`${type}-${i}`}>
                                    <h4>{`${type === 'adult' ? 'Người lớn' : type === 'child' ? 'Trẻ em' : 'Em bé'} ${i + 1}`}</h4>
                                    <div className="form-group">
                                        <label>Họ tên *</label>
                                        <input
                                            type="text"
                                            value={passengerDetails[type][i]?.fullName || ''}
                                            onChange={(e) => handlePassengerDetailChange(type, i, 'fullName', e.target.value)}
                                            placeholder="Nhập họ tên"
                                        />
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Giới tính</label>
                                            <select
                                                value={passengerDetails[type][i]?.gender || 'Nam'}
                                                onChange={(e) => handlePassengerDetailChange(type, i, 'gender', e.target.value)}
                                            >
                                                <option value="Nam">Nam</option>
                                                <option value="Nữ">Nữ</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Ngày sinh</label>
                                            <input
                                                type="date"
                                                value={passengerDetails[type][i]?.birthDate || ''}
                                                onChange={(e) => handlePassengerDetailChange(type, i, 'birthDate', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                ))}

                <div className="submit-section">
                    <button className="submit-button" onClick={handleSubmitPassengers} disabled={isSubmitting}>
                        {isSubmitting ? 'Đang xử lý...' : 'Xác nhận thông tin hành khách'}
                    </button>
                </div>
            </div>
        );
    };

    export default BookingPassenger;
