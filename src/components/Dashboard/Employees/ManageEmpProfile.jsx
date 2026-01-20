import React, { useState } from "react";
import styles from './Employees.module.css'
import dp from "../../../images/image.png";

function ManageEmpProfile() {

    const [editclick, setEditclick] = useState(false);

    const onEditClick = () => editclick ? setEditclick(false) : setEditclick(true)
  return (
    <>
      <div className="container pt-2 ">
        <div className="row pb-5">
          <div className="col-3">
            <div className={styles.dp}>
              <img src={dp} alt="Profile pic" />
            </div>
          </div>
         {!editclick &&  <div className="col-3">
          <div className={styles.editbtns}>
              <button onClick={onEditClick}>Edit Details</button>
            </div>
            <div className={styles.enbtns}>
                <button className='submitbtn'>Enable</button>
                <button className='cancelbtn'>Disable</button>
              </div>
          </div>}
          {editclick &&  <div className="col-3">
            <div className={styles.enbtns}>
                <button className={styles.submit}>Submit</button>
                <button onClick={onEditClick} className={styles.cancel}>Cancel</button>
              </div>
          </div>}
        </div>

        <div className="row pt-3 justify-content-around">
          <div className={`col px-3 ${styles.details}`}>
          <div className="row pb-2 px-2">
            <div className={`col-5 ${styles.label}`}>
                <label htmlFor="">Employee ID</label>
            </div>
            <div className={`col-5 ${styles.value}`}>
                <input type="text" name="" id="" />
            </div>
        </div>
        <div className="row pb-2 px-2">
            <div className={`col-5 ${styles.label}`}>
                <label htmlFor="">First Name</label>
            </div>
            <div className={`col-5 ${styles.value}`}>
                <input type="text" name="" id="" />
            </div>
        </div>
        <div className="row pb-2 px-2">
            <div className={`col-5 ${styles.label}`}>
                <label htmlFor="">Last Name</label>
            </div>
            <div className={`col-5 ${styles.value}`}>
                <input type="text" name="" id="" />
            </div>
        </div>
        <div className="row pb-2 px-2">
            <div className={`col-5 ${styles.label}`}>
                <label htmlFor="">Surname</label>
            </div>
            <div className={`col-5 ${styles.value}`}>
                <input type="text" name="" id="" />
            </div>
        </div> <div className="row pb-2 px-2">
            <div className={`col-5 ${styles.label}`}>
                <label htmlFor="">Date of Birth</label>
            </div>
            <div className={`col-5 ${styles.value}`}>
                <input type="text" name="" id="" />
            </div>
        </div> <div className="row pb-2 px-2">
            <div className={`col-5 ${styles.label}`}>
                <label htmlFor="">Gender</label>
            </div>
            <div className={`col-5 ${styles.value}`}>
                <input type="text" name="" id="" />
            </div>
        </div> <div className="row pb-2 px-2">
            <div className={`col-5 ${styles.label}`}>
                <label htmlFor="">Marital Status</label>
            </div>
            <div className={`col-5 ${styles.value}`}>
                <input type="text" name="" id="" />
            </div>
        </div> <div className="row pb-2 px-2">
            <div className={`col-5 ${styles.label}`}>
                <label htmlFor="">Adhaar Number</label>
            </div>
            <div className={`col-5 ${styles.value}`}>
                <input type="text" name="" id="" />
            </div>
        </div> <div className="row pb-2 px-2">
            <div className={`col-5 ${styles.label}`}>
                <label htmlFor="">PAN Number</label>
            </div>
            <div className={`col-5 ${styles.value}`}>
                <input type="text" name="" id="" />
            </div>
        </div> <div className="row pb-2 px-2">
            <div className={`col-5 ${styles.label}`}>
                <label htmlFor="">Religion</label>
            </div>
            <div className={`col-5 ${styles.value}`}>
                <input type="text" name="" id="" />
            </div>
        </div> <div className="row pb-2 px-2">
            <div className={`col-5 ${styles.label}`}>
                <label htmlFor="">Caste</label>
            </div>
            <div className={`col-5 ${styles.value}`}>
                <input type="text" name="" id="" />
            </div>
        </div> <div className="row pb-2 px-2">
            <div className={`col-5 ${styles.label}`}>
                <label htmlFor="">Sub Caste</label>
            </div>
            <div className={`col-5 ${styles.value}`}>
                <input type="text" name="" id="" />
            </div>
        </div> <div className="row pb-2 px-2">
            <div className={`col-5 ${styles.label}`}>
                <label htmlFor="">Blood group</label>
            </div>
            <div className={`col-5 ${styles.value}`}>
                <input type="text" name="" id="" />
            </div>
        </div> <div className="row pb-2 px-2">
            <div className={`col-5 ${styles.label}`}>
                <label htmlFor="">Passport Number</label>
            </div>
            <div className={`col-5 ${styles.value}`}>
                <input type="text" name="" id="" />
            </div>
        </div> <div className="row pb-2 px-2">
            <div className={`col-5 ${styles.label}`}>
                <label htmlFor="">UAN Number</label>
            </div>
            <div className={`col-5 ${styles.value}`}>
                <input type="text" name="" id="" />
            </div>
        </div> <div className="row pb-2 px-2">
            <div className={`col-5 ${styles.label}`}>
                <label htmlFor="">PF Number</label>
            </div>
            <div className={`col-5 ${styles.value}`}>
                <input type="text" name="" id="" />
            </div>
        </div>

          </div>
          <div className={`col px-3 ${styles.details}`}>
          <h6 className={styles.h6}>Temporary Address</h6>
        <div className="row pb-2  px-2">
            <div className={`col-5 ${styles.label}`}>
                <label htmlFor="">H.No</label>
            </div>
            <div className={`col-5 ${styles.value}`}>
                <input type="text" name="" id="" />
            </div>
        </div>
        <div className="row pb-2 px-2">
            <div className={`col-5 ${styles.label}`}>
                <label htmlFor="">Address Line 1</label>
            </div>
            <div className={`col-5 ${styles.value}`}>
                <input type="text" name="" id="" />
            </div>
        </div>
        <div className="row pb-2 px-2">
            <div className={`col-5 ${styles.label}`}>
                <label htmlFor="">Address Line 2</label>
            </div>
            <div className={`col-5 ${styles.value}`}>
                <input type="text" name="" id="" />
            </div>
        </div>
        <div className="row pb-2 px-2">
            <div className={`col-5 ${styles.label}`}>
                <label htmlFor="">City/Village</label>
            </div>
            <div className={`col-5 ${styles.value}`}>
                <input type="text" name="" id="" />
            </div>
        </div>
        <div className="row pb-2 px-2">
            <div className={`col-5 ${styles.label}`}>
                <label htmlFor="">District</label>
            </div>
            <div className={`col-5 ${styles.value}`}>
                <input type="text" name="" id="" />
            </div>
        </div>
        <div className="row pb-2 px-2">
            <div className={`col-5 ${styles.label}`}>
                <label htmlFor="">State</label>
            </div>
            <div className={`col-5 ${styles.value}`}>
                <input type="text" name="" id="" />
            </div>
        </div>
        <div className="row pb-2 px-2">
            <div className={`col-5 ${styles.label}`}>
                <label htmlFor="">Pincode</label>
            </div>
            <div className={`col-5 ${styles.value}`}>
                <input type="text" name="" id="" />
            </div>
        </div>
        <h6 className={styles.h6}>Permanent Address</h6>
      <div className="row pb-2  px-2">
        <div className={`col-5 ${styles.label}`}>
          <label htmlFor="">H.No</label>
        </div>
        <div className={`col-5 ${styles.value}`}>
          <input type="text" name="" id="" />
        </div>
      </div>
      <div className="row pb-2 px-2">
        <div className={`col-5 ${styles.label}`}>
          <label htmlFor="">Address Line 1</label>
        </div>
        <div className={`col-5 ${styles.value}`}>
          <input type="text" name="" id="" />
        </div>
      </div>
      <div className="row pb-2 px-2">
        <div className={`col-5 ${styles.label}`}>
          <label htmlFor="">Address Line 2</label>
        </div>
        <div className={`col-5 ${styles.value}`}>
          <input type="text" name="" id="" />
        </div>
      </div>
      <div className="row pb-2 px-2">
        <div className={`col-5 ${styles.label}`}>
          <label htmlFor="">City/Village</label>
        </div>
        <div className={`col-5 ${styles.value}`}>
          <input type="text" name="" id="" />
        </div>
      </div>
      <div className="row pb-2 px-2">
        <div className={`col-5 ${styles.label}`}>
          <label htmlFor="">District</label>
        </div>
        <div className={`col-5 ${styles.value}`}>
          <input type="text" name="" id="" />
        </div>
      </div>
      <div className="row pb-2 px-2">
        <div className={`col-5 ${styles.label}`}>
          <label htmlFor="">State</label>
        </div>
        <div className={`col-5 ${styles.value}`}>
          <input type="text" name="" id="" />
        </div>
      </div>
     
      <div className="row pb-2 px-2">
        <div className={`col-5 ${styles.label}`}>
          <label htmlFor="">Personal Email</label>
        </div>
        <div className={`col-5 ${styles.value}`}>
          <input type="text" name="" id="" />
        </div>
      </div>
      <div className="row pb-2 px-2">
        <div className={`col-5 ${styles.label}`}>
          <label htmlFor="">Contact Number</label>
        </div>
        <div className={`col-5 ${styles.value}`}>
          <input type="text" name="" id="" />
        </div>
      </div>
           
          </div>
          <div className={`col px-3 ${styles.details}`}>
          <h6 className={styles.h6}>Emergency Contact Details</h6>
      <div className="row pb-2  px-2">
        <div className={`col-5 ${styles.label}`}>
          <label htmlFor="">Email</label>
        </div>
        <div className={`col-5 ${styles.value}`}>
          <input type="text" name="" id="" />
        </div>
      </div>
      <div className="row pb-2 px-2">
        <div className={`col-5 ${styles.label}`}>
          <label htmlFor="">Phone Number</label>
        </div>
        <div className={`col-5 ${styles.value}`}>
          <input type="text" name="" id="" />
        </div>
      </div>
      <div className="row pb-2 px-2">
        <div className={`col-5 ${styles.label}`}>
          <label htmlFor="">Relative Name</label>
        </div>
        <div className={`col-5 ${styles.value}`}>
          <input type="text" name="" id="" />
        </div>
      </div>
      <div className="row pb-2 px-2">
        <div className={`col-5 ${styles.label}`}>
          <label htmlFor="">Relation</label>
        </div>
        <div className={`col-5 ${styles.value}`}>
          <input type="text" name="" id="" />
        </div>
      </div>
      <h6 className={styles.h6}>Bank Account Details</h6>
      <div className="row pb-2  px-2">
        <div className={`col-5 ${styles.label}`}>
          <label htmlFor="">Bank Name</label>
        </div>
        <div className={`col-5 ${styles.value}`}>
          <input type="text" name="" id="" />
        </div>
      </div>
      <div className="row pb-2 px-2">
        <div className={`col-5 ${styles.label}`}>
          <label htmlFor="">Account Number</label>
        </div>
        <div className={`col-5 ${styles.value}`}>
          <input type="text" name="" id="" />
        </div>
      </div>
      <div className="row pb-2 px-2">
        <div className={`col-5 ${styles.label}`}>
          <label htmlFor="">IFSC Code</label>
        </div>
        <div className={`col-5 ${styles.value}`}>
          <input type="text" name="" id="" />
        </div>
      </div>
      <div className="row pb-2 px-2">
        <div className={`col-5 ${styles.label}`}>
          <label htmlFor="">Branch name</label>
        </div>
        <div className={`col-5 ${styles.value}`}>
          <input type="text" name="" id="" />
        </div>
      </div>
      <div className="row pb-2 px-2">
        <div className={`col-5 ${styles.label}`}>
          <label htmlFor="">Address</label>
        </div>
        <div className={`col-5 ${styles.value}`}>
          <input type="text" name="" id="" />
        </div>
      </div>
          </div>
        </div>
        {/* <div className="row py-5 mb-5 justify-content-center">
          <div className="col-9">
            <QualificationDetails />
          </div>
        </div> */}
      </div>
    </>
  );
}

export default ManageEmpProfile;
