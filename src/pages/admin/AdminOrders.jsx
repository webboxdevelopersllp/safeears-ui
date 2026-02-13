import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import date from "date-and-time";

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Select,
  MenuItem,
  TextField,
  FormControl,
  InputLabel,
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { getOrders } from "../../redux/actions/admin/ordersAction";
import { useSearchParams } from "react-router-dom";
import RangeDatePicker from "../../components/RangeDatePicker";
import FilterArray from "../../components/FilterArray";
import ClearFilterButton from "../../components/ClearFilterButton";
import JustLoading from "../../components/JustLoading";
import SearchBar from "../../components/SearchBar";
import Pagination from "../../components/Pagination";
import StatusComponent from "../../components/StatusComponent";
import { AiOutlineEdit } from "react-icons/ai";
import UpdateOrder from "../../components/UpdateOrder";
import axios from "axios";
import { URL } from "../../Common/api";
import toast from "react-hot-toast";

const AdminOrders = () => {
  const dispatch = useDispatch();

  const { orders, loading, error, totalAvailableOrders } = useSelector(
    (state) => state.orders
  );

  const [selectedOrderToUpdate, setSelectedOrderToUpdate] = useState({});
  const [updateModal, setUpdateModal] = useState(false);

  const toggleUpdateModal = (data) => {
    // if (data.status === "cancelled") {
    //   toast.error("Cannot Edit Cancelled Product");
    //   return;
    // }
    if (data.status === "returned") {
      toast.error("Cannot Edit Returned Product");
      return;
    }
    setUpdateModal(!updateModal);
    setSelectedOrderToUpdate(data);
  };

  const [startingDate, setStartingDate] = useState("");
  const [endingDate, setEndingDate] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [searchParams, setSearchParams] = useSearchParams();

  const [hospitals, setHospitals] = useState([]);
  const [doctors, setDoctors] = useState([]);

  const selectedHospital = searchParams.get("hospital") || "";
  const selectedDoctor = searchParams.get("doctor") || "";

  // Fetch Hospitals
  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        const { data } = await axios.get(`${URL}/admin/hospitals`, { withCredentials: true });
        setHospitals(data.hospitals);
      } catch (error) {
        console.error("Error fetching hospitals", error);
      }
    };
    fetchHospitals();
  }, []);

  // Fetch Doctors (Strictly by Hospital)
  useEffect(() => {
    if (selectedHospital) {
      const fetchDoctors = async () => {
        try {
          // Send hospital ID to fetch doctors associated with that hospital
          const { data } = await axios.get(`${URL}/admin/doctors?hospital=${selectedHospital}`, { withCredentials: true });
          setDoctors(data.doctors);
        } catch (error) {
          console.error("Error fetching doctors", error);
          setDoctors([]);
        }
      };
      fetchDoctors();
    } else {
      setDoctors([]); // Clear doctors if no hospital is selected
    }
  }, [selectedHospital]);

  const handleFilter = (type, value) => {
    const params = new URLSearchParams(window.location.search);
    if (value === "") {
      if (type === "page") {
        setPage(1);
      }
      params.delete(type);
    } else {
      if (type === "page" && value === 1) {
        params.delete(type);
        setPage(1);
      } else {
        params.set(type, value);
        if (type === "page") {
          setPage(value);
        }
      }
    }
    setSearchParams(params.toString() ? "?" + params.toString() : "");
  };

  const removeFilters = () => {
    const params = new URLSearchParams(window.location.search);
    params.delete("search");
    params.delete("page");
    params.delete("status");
    params.delete("startingDate");
    params.delete("endingDate");
    params.delete("hospital");
    params.delete("doctor");
    setSearch("");
    setStartingDate("");
    setEndingDate("");
    setSearchParams(params);
  };

  // Filters setting initially
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pageNumber = params.get("page");
    setPage(parseInt(pageNumber || 1));
  }, []);

  // Getting all the orders on page load
  useEffect(() => {
    dispatch(getOrders(searchParams));
    const params = new URLSearchParams(window.location.search);
    const pageNumber = params.get("page");
    setPage(parseInt(pageNumber || 1));
  }, [searchParams]);

  const navigate = useNavigate();

  const handleClickRow = (id) => {
    navigate(`/admin/order/${id}`); // Navigate to the single order page
  };

  // console.log(orders);

  return (
    <section className="">
      {updateModal && (
        <div className="w-full h-screen bg-slate-600 fixed top-0 left-0 z-[9999] bg-opacity-40 flex items-center justify-center">
          <UpdateOrder
            toggleModal={toggleUpdateModal}
            data={selectedOrderToUpdate}
          />
        </div>
      )}
      <h1 className="text-2xl font-semibold">All Orders</h1>
      <div className="w-full pt-5  ">
        <div className="w-full grid  items-center gap-4 p-1">
          <SearchBar
            handleClick={handleFilter}
            search={search}
            setSearch={setSearch}
            placeholder="Search Using Order Id..."
          />
          <div className="lg:flex  w-full justify-start gap-5 items-center font-semibold">
            <FilterArray
              list={[
                "all",
                "pending",
                "processing",
                "shipped",
                "delivered",
                "cancelled",
              ]}
              handleClick={handleFilter}
            />

            <FormControl sx={{ m: 1, minWidth: 150 }} size="small">
              <InputLabel>Hospital</InputLabel>
              <Select
                value={selectedHospital}
                label="Hospital"
                onChange={(e) => {
                  const val = e.target.value;
                  const params = new URLSearchParams(window.location.search);
                  if (val === "") {
                    params.delete("hospital");
                  } else {
                    params.set("hospital", val);
                  }
                  params.delete("doctor"); // Reset doctor
                  setSearchParams(params);
                }}
              >
                <MenuItem value=""><em>All</em></MenuItem>
                {hospitals.map((h) => (
                  <MenuItem key={h._id} value={h._id}>{h.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl sx={{ m: 1, minWidth: 150 }} size="small">
              <InputLabel>Doctor</InputLabel>
              <Select
                value={selectedDoctor}
                label="Doctor"
                onChange={(e) => handleFilter("doctor", e.target.value)}
                disabled={!selectedHospital} // Strictly disable if no hospital selected
              >
                <MenuItem value=""><em>All</em></MenuItem>
                {doctors.map((d) => (
                  <MenuItem key={d._id} value={d._id}>{d.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <div className="flex my-2 gap-3 ">
              <RangeDatePicker
                handleFilter={handleFilter}
                startingDate={startingDate}
                setStartingDate={setStartingDate}
                endingDate={endingDate}
                setEndingDate={setEndingDate}
              />
              <ClearFilterButton handleClick={removeFilters} />
            </div>
          </div>
        </div>
        <Paper>

          <TableContainer>

            <Table aria-label="simple table">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <JustLoading size={10} />
                </div>
              ) : orders && orders.length > 0 ? (
                <div className=" overflow-x-scroll lg:overflow-hidden  rounded-lg">
                  <table className="w-full  table-auto">
                    <thead className="font-normal">
                      <tr className="border-b border-gray-200">
                        <th className="admin-table-head">No:</th>
                        <th className="admin-table-head">Order id</th>
                        <th className="admin-table-head w-64">Product</th>
                        <th className="admin-table-head">Order Date</th>
                        <th className="admin-table-head">Customer</th>
                        <th className="admin-table-head">Total</th>
                        <th className="admin-table-head">Delivery Date</th>
                        <th className="admin-table-head">Status</th>
                        <th className="admin-table-head">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((item, index) => {
                        const isLast = index === orders.length - 1;
                        const classes = isLast
                          ? "p-4"
                          : "p-4 border-b border-gray-200 ";
                        const adjustedIndex = (page - 1) * 10 + index + 1;
                        // console.log(item);

                        return (
                          <TableRow
                            className="hover:bg-gray-200"
                            style={{ cursor: "pointer" }}
                            onClick={() => handleClickRow(item.orderId)}
                          >
                            <TableCell
                              component="th"
                              scope="row"
                              hover
                              key={item._id}
                              style={{ cursor: "pointer" }}
                              className=""
                            >
                              {adjustedIndex}
                            </TableCell>
                            <TableCell
                              component="th"
                              scope="row"
                              hover
                              key={item._id}
                              onClick={() => handleClickRow(row.id)}
                              style={{ cursor: "pointer" }}
                              className="hover:bg-gray-200"
                            >
                              {item.orderId}
                            </TableCell>
                            <TableCell className="text-black" align="right">
                              <div>
                                <p className="line-clamp-1 mb-1 font-semibold">
                                  {item?.products[0]?.productId?.name}
                                </p>
                                <p className="font-semibold text-gray-500">
                                  {item.totalQuantity === 1
                                    ? item.totalQuantity + " Product"
                                    : "+" +
                                    (item.totalQuantity - 1) +
                                    " Products"}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell align="right">
                              {date.format(
                                new Date(item.createdAt),
                                "MMM DD YYYY"
                              )}
                            </TableCell>
                            <TableCell align="right">
                              {item.user?.firstName} {item.user?.lastName}
                            </TableCell>
                            <TableCell align="right">
                              {item.totalPrice}₹
                            </TableCell>
                            <TableCell align="right">
                              {date.format(
                                new Date(item.deliveryDate),
                                "MMM DD YYYY"
                              )}
                            </TableCell>
                            <TableCell align="right">
                              <StatusComponent status={item.status} />
                            </TableCell>
                            <TableCell
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleUpdateModal({
                                  id: item._id,
                                  status: item.status,
                                  paymentMode: item.paymentMode,
                                  deliveryDate: item.createdAt,
                                  trackingId: item.trackingId,
                                });
                              }}
                            >
                              <div className="flex items-center text-lg">
                                <span className="hover:text-gray-500 flex gap-5 cursor-pointer">
                                  Edit
                                  <AiOutlineEdit />
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </tbody>
                  </table>
                  <div className="py-5">
                    <Pagination
                      handleClick={handleFilter}
                      page={page}
                      number={10}
                      totalNumber={totalAvailableOrders}
                    />
                  </div>
                </div>
              ) : (
                <div className="absolute top-1/2 left-1/3 lg:left-1/2 lg:right-1/2">
                  <p className="w-44">
                    {error ? error : "No orders are placed yet"}
                  </p>
                </div>
              )}
            </Table>
          </TableContainer>
        </Paper>
      </div>
    </section>
  );
};

export default AdminOrders;
