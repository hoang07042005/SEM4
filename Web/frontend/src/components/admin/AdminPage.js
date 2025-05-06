import React from "react";
import { useLocation } from "react-router-dom";
import AdminDashboard from "./AdminDashboard";
import UserIndex from "./user/UserIndex";
import DestinationIndex from "./destination/DestinationIndex";
import AddDestination from "./destination/AddDestination";
import UpdateDestination from "./destination/UpdateDestination";
import EventIndex from "./event/EventIndex";
import AddEvent from "./event/AddEvent";
import UpdateEvent from "./event/UpdateEvent";
import AddTour from "./tour/AddTour";
import UpdateTour from "./tour/UpdateTour";
import TourIndex from "./tour/TourIndex";
import DetailDestination from "./destination/DetailDestination";
import DetailEvent from "./event/DetailEvent";
import DetailTour from "./tour/DetailTour";


const AdminPage = () => {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);


  const getComponent = () => {
    if (pathSegments.includes('destination') || pathSegments.includes('destinations')) {
      if (pathSegments.includes('add')) {
        return <AddDestination />;
      }
      if (pathSegments.includes('detail')) {
        return <DetailDestination />;
      }
      if (pathSegments.includes('edit')) {
        return <UpdateDestination />;
      }
      return <DestinationIndex />;
    }
    
    if (pathSegments.includes('event') || pathSegments.includes('events')) {
      if (pathSegments.includes('add')) {
        return <AddEvent />;
      }
      if (pathSegments.includes('detail')) {
        return <DetailEvent />;
      }
      if (pathSegments.includes('edit')) {
        return <UpdateEvent />;
      }
      return <EventIndex />;
    }
    
    if (pathSegments.includes('tour') || pathSegments.includes('tours')) {
      if (pathSegments.includes('add')) {
        return <AddTour />;
      }
      if (pathSegments.includes('detail')) {
        return <DetailTour />;
      }
      if (pathSegments.includes('edit')) {
        return <UpdateTour />;
      }
      return <TourIndex />;
    }

    return <UserIndex />;
  };

  return (
    <AdminDashboard>
      {getComponent()}
    </AdminDashboard>
  );
};

export default AdminPage;