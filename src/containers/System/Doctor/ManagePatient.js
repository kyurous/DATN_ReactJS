import React, { Component } from "react";
import { connect } from "react-redux";
import { FormattedMessage } from "react-intl";
import "./ManagePatient.scss";
import DatePicker from "../../../components/Input/DatePicker";
import {
  cancelBooking,
  getAllPatientForDoctor,
  postSendRemedy,
  postCreateRemedy,
  updateBookingStatus,
} from "../../../services/userService";
import moment from "moment";
import { LANGUAGES } from "../../../utils";
import RemedyModal from "./RemedyModal";
import CreateImageRemedyModal from "./CreateImageRemedyModal";
import { toast } from "react-toastify";
import LoadingOverlay from "react-loading-overlay";
import ClimbingBoxLoader from "react-spinners/ClimbingBoxLoader";
import { withRouter } from '../../../utils/withRouter';  //navigate
import Lightbox from "react-image-lightbox";
import "react-image-lightbox/style.css"; // This only needs to be imported once in your app

class ManagePatient extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentDate: moment(new Date()).startOf("day").valueOf(),
      dataPatient: [],
      isOpenRemedyModal: false,
      isOpenCreateImageRemedyModal: false,
      dataModal: {},
      dataModalCreateRemedy: {},
      isShowLoading: false,
      previewImgURL: ""
    };
  }

  async componentDidMount() {
    await this.getDataPatient();


  }

  getDataPatient = async () => {
    let { user } = this.props;
    let { currentDate } = this.state;
    let formatedDate = new Date(currentDate).getTime();
    if (user && user.id) {
      let res = await getAllPatientForDoctor({
        doctorId: user.id,
        date: formatedDate,
      });
      if (res && res.errCode === 0) {
        this.setState({
          dataPatient: res.data,
        });
      }
    }
  };

  async componentDidUpdate(prevProps, prevState, snapshot) {
    if (this.props.language !== prevProps.language) {
    }
    if (this.props.user !== prevProps.user) {
      await this.getDataPatient();
    }
  }

  handleOnChangeDatePicker = (date) => {
    this.setState(
      {
        currentDate: date[0],
      },
      async () => {
        await this.getDataPatient();
      }
    );
  };
  handleBtnConfirm = (item) => {
    let data = {
      doctorId: item.doctorId,
      patientId: item.patientId,
      email: item.patientData.email,
      timeType: item.timeType,
      patientName: item.patientData.firstName,
      imageRemedy: item.imageRemedy,
      token: item.token,
    };
    this.setState({
      isOpenRemedyModal: true,
      dataModal: data,
    });
  };
  handleBtnCreateRemedy = (item) => {
    const navigateLink = `/admin-dashboard/doctor/manage-patient/${item.id}`
    this.props.navigate(navigateLink);
  };

  handleBtnCancel = async (item) => {

    this.setState({ isShowLoading: true });

    if (!item || !item.doctorId || !item.patientId || !item.timeType || !item.date || !item.statusId) {
      console.error("Thiếu dữ liệu cần thiết để huỷ lịch hẹn:", item);
      this.setState({ isShowLoading: false });
      toast.error("Không thể huỷ lịch vì thiếu thông tin!");
      return;
    }

    let doctorName = item?.doctorData?.lastName + " " + item?.doctorData?.firstName;

    let res = await cancelBooking({
      doctorId: item.doctorId,
      patientId: item.patientId,
      timeType: item.timeType,
      date: item.date,
      statusId: item.statusId,
      doctorName: doctorName,
      language: this.props.language,
    });

    if (res && res.errCode === 0) {
      this.setState({ isShowLoading: false });
      if (this.props.language === "en") {
        toast.success("cancel appointment succeed!");
      } else {
        toast.success("Hủy cuộc hẹn thành công!");
      }
      await this.getDataPatient();
    } else {
      this.setState({ isShowLoading: true });
      if (this.props.language === "en") {
        toast.error("Something wrongs...!");
      } else {
        toast.error("Lỗi!");
      }
    }
  };

  closeRemedyModal = () => {
    this.setState({
      isOpenRemedyModal: false,
      dataModal: {},
    });
  };
  closeCreateImageRemedyModal = () => {
    this.setState({
      isOpenCreateImageRemedyModal: false,
      dataModalCreateRemedy: {},
    });
  };

  sendRemedy = async (dataChild) => {
    let { dataModal } = this.state;
    this.setState({ isShowLoading: true });

    let totalCostData = null;
    let specialtyIdData = null;
    if (
      this.props.user &&
      this.props.user.Doctor_Infor &&
      this.props.user.Doctor_Infor.priceTypeData &&
      this.props.user.Doctor_Infor.priceTypeData.valueEn
    ) {
      totalCostData = this.props.user.Doctor_Infor.priceTypeData.valueEn;
    }
    if (
      this.props.user &&
      this.props.user.Doctor_Infor &&
      this.props.user.Doctor_Infor.specialtyId
    ) {
      specialtyIdData = this.props.user.Doctor_Infor.specialtyId;
    }

    let res = await postSendRemedy({
      email: dataChild.email,
      imgBase64: dataChild.imgBase64,
      doctorId: dataModal.doctorId,
      patientId: dataModal.patientId,
      timeType: dataModal.timeType,
      language: this.props.language,
      patientName: dataModal.patientName,
      totalCost: totalCostData,
      specialtyId: specialtyIdData,
    });
    if (res && res.errCode === 0) {
      this.setState({ isShowLoading: false });

      if (this.props.language == "en") {
        toast.success("Send Remedy succeed!");
      } else {
        toast.success("Gửi đơn thuốc thành công!");
      }
      this.closeRemedyModal();
      await this.getDataPatient();
    } else {
      this.setState({ isShowLoading: true });
      if (this.props.language == "en") {
        toast.error("Something wrongs...!");
      } else {
        toast.error("Lỗi!");
      }
    }
    this.setState({ isShowLoading: false });
  };

  createRemedyImage = async (dataChild) => {
    let { dataModalCreateRemedy } = this.state;
    this.setState({ isShowLoading: true });

    let res = await postCreateRemedy({
      email: dataChild.email,
      listMedicine: dataChild.listMedicine,
      desciption: dataChild.desciption,
      doctorId: dataModalCreateRemedy.doctorId,
      patientId: dataModalCreateRemedy.patientId,
      timeType: dataModalCreateRemedy.timeType,
      date: dataModalCreateRemedy.date,
      token: dataModalCreateRemedy.token,
      language: this.props.language,
      patientName: dataModalCreateRemedy.patientName,
      doctorName: dataModalCreateRemedy.doctorName,
    });
    if (res && res.errCode === 0) {
      this.setState({ isShowLoading: false });
      if (this.props.language == "en") {
        toast.success("Create Remedy succeed!");
      } else {
        toast.success("Tạo đơn thuốc thành công!");
      }
      this.closeCreateImageRemedyModal();
      await this.getDataPatient();
    } else {
      this.setState({ isShowLoading: true });
      if (this.props.language == "en") {
        toast.error("Something wrongs...!");
      } else {
        toast.error("Lỗi!");
      }

    }
    this.setState({ isShowLoading: false });
  };

  openPreviewImage = (item) => {
    this.setState({
      previewImgURL: ""
    })

    let imageBase64 = "";

    if (item.imageRemedy) {
      imageBase64 = new Buffer(item.imageRemedy, "base64").toString("binary");
      if (imageBase64) {
        console.log("imageBase64 co")
        this.setState({
          previewImgURL: imageBase64
        })

        if (this.state.previewImgURL) {
          this.setState({
            isOpen: true,
          });
        }
      }
    } else {
      console.log("this.props.language", this.props.language)
      if (this.props.language == "vi") {
        toast.info("Bác sĩ chưa tạo đơn thuốc cho bệnh nhân này!");
      } else {
        toast.info("The doctor has not created a prescription for this patient!");
      }
    }

    if (this.state.previewImgURL) console.log("this.state.previewImgURL", this.state.previewImgURL)
    console.log("imageBase64", imageBase64)




    console.log("isOpen", this.state.isOpen)
  };

  handleUpdateStatus = async (item) => {
    const res = await updateBookingStatus({
      bookingId: item.id,
      newStatus: "S3", // hoặc statusId tương ứng với "Đã khám"
    });

    if (res && res.errCode === 0) {
      toast.success(this.props.language === "vi" ? "Cập nhật thành công" : "Update succeed");
      await this.getDataPatient();
    } else {
      toast.error(this.props.language === "vi" ? "Lỗi cập nhật" : "Update failed");
    }
  };


  render() {
    let {
      dataPatient,
      isOpenRemedyModal,
      isOpenCreateImageRemedyModal,
      dataModal,
      dataModalCreateRemedy,
    } = this.state;
    let { language } = this.props;
    console.log("check datadataPatient", dataPatient)
    return (
      <>
        <LoadingOverlay
          active={this.state.isShowLoading}
          spinner={<ClimbingBoxLoader color={"#86e7d4"} size={15} />}
        >
          <RemedyModal
            isOpenModal={isOpenRemedyModal}
            dataModal={dataModal}
            closeRemedyModal={this.closeRemedyModal}
            sendRemedy={this.sendRemedy}
          />
          {/* <CreateImageRemedyModal
            isOpenCreateImageRemedyModal={isOpenCreateImageRemedyModal}
            dataModalCreateRemedy={dataModalCreateRemedy}
            closeCreateImageRemedyModal={this.closeCreateImageRemedyModal}
            createRemedyImage={this.createRemedyImage}
          /> */}

          <div className="manage-patient-container">
            <div className="m-p-title font-weight-bold"><FormattedMessage id={"manage-patient.title"} /> </div>
            <div className="manage-patient-body row">
              <div className="col-4 form-group">
                <label><FormattedMessage id={"manage-patient.choose-date"} /></label>
                <DatePicker
                  onChange={this.handleOnChangeDatePicker}
                  className="form-control"
                  value={this.state.currentDate}
                />
              </div>
              <div className="col-12 table-manage-patient">
                <table>
                  <tbody>
                    <tr>
                      <th>#</th>
                      <th><FormattedMessage id={"manage-patient.examination-time"} /></th>
                      <th><FormattedMessage id={"manage-patient.patient-name"} /></th>
                      <th><FormattedMessage id={"manage-patient.address"} /></th>
                      <th><FormattedMessage id={"manage-patient.phone-number"} /></th>
                      <th><FormattedMessage id={"manage-patient.gender"} /></th>
                      <th><FormattedMessage id={"manage-patient.reason"} /></th>
                      <th><FormattedMessage id={"manage-patient.status"} /></th>
                      <th><FormattedMessage id={"manage-patient.prescription"} /></th>
                      <th><FormattedMessage id={"manage-patient.actions"} /></th>
                    </tr>
                    {dataPatient && dataPatient.length > 0 ? (
                      dataPatient.map((item, index) => {
                        let time =
                          language === LANGUAGES.VI
                            ? item.timeTypeDataPatient.valueVi
                            : item.timeTypeDataPatient.valueEn;
                        let gender =
                          language === LANGUAGES.VI
                            ? (item.patientGender == "M" ? "Nam" : "Nữ")
                            : (item.patientGender == "M" ? "Male" : "Female")
                        return (
                          <tr key={index}>
                            <td>{index + 1}</td>
                            <td>{time}</td>
                            <td>{item.patientName}</td>
                            <td>{item.patientAddress}</td>
                            <td>
                              {item.patientPhoneNumber ? item.patientPhoneNumber : ""}
                            </td>
                            <td>{gender}</td>
                            <td>{item.patientReason}</td>
                            <td>
                              {language === LANGUAGES.VI
                                ? item.statusData?.valueVi
                                : item.statusData?.valueEn}
                            </td>
                            <td>
                              {item.statusId !== "S1" && (
                                <button
                                  className="btn btn-primary"
                                  onClick={() => this.handleBtnConfirm(item)}
                                >
                                  <FormattedMessage id={"manage-patient.send-prescriptions"} />
                                </button>
                              )}
                              {item.statusId !== "S1" && (
                                <button
                                  className="btn btn-info mx-5"
                                  onClick={() => this.handleBtnCreateRemedy(item)}
                                >
                                  <FormattedMessage id={"manage-patient.create-prescriptions"} />
                                </button>
                              )}

                            </td>
                            <td>
                              {item.statusId === "S2" && (
                                <>
                                  <button
                                    className="btn btn-success mx-2"
                                    onClick={() => this.handleUpdateStatus(item)}
                                  >
                                    <FormattedMessage id={"manage-patient.mark-done"} />
                                  </button>
                                  <button
                                    className="btn btn-danger"
                                    onClick={() => this.handleBtnCancel(item)}
                                  >
                                    <FormattedMessage id={"manage-patient.cancel"} />
                                  </button>
                                </>
                              )}

                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="9" style={{ textAlign: "center" }}>
                          {language === LANGUAGES.VI ? "Không có bệnh nhân đặt lịch vào ngày này" : "No patients booked for this date"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {this.state.isOpen === true && (
            <Lightbox
              mainSrc={this.state.previewImgURL}
              onCloseRequest={() => this.setState({ isOpen: false })}
            />
          )}

        </LoadingOverlay>
      </>
    );
  }
}

const mapStateToProps = (state) => {
  return { language: state.app.language, user: state.user.userInfo };
};

const mapDispatchToProps = (dispatch) => {
  return {};
};

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(ManagePatient));

{/* <div
                                className="text-center pointer text-primary"
                                // style={{
                                //   backgroundImage: `url(${item.imageRemedy})`,
                                // }}
                                onClick={() => this.openPreviewImage(item)}
                              ><FormattedMessage id={"manage-patient.view"} /></div> */}
