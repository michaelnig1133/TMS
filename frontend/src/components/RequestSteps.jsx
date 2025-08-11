import React from 'react';
import { GiVendingMachine } from "react-icons/gi";
import { FcApprove } from "react-icons/fc";
import { AiFillSchedule } from "react-icons/ai";
import { IoLocation } from "react-icons/io5";

import { useLanguage } from '../context/LanguageContext';
import Car from "../assets/car.png";
import "../index.css";

const RequestSteps = () => {
  const { mylanguage } = useLanguage(); // Access the current language context

  return (
    <div>
      <h2 className="d-flex justify-content-center mb-4" id="texthero2">
        {mylanguage === 'EN' ? 'Schedule Trip with These Steps' : 'በእነዚህ እርምጃዎች ጉዞ ይመዝግቡ'}
      </h2>

      {/* Row to hold the cards */}
      <div className="cards">
        <div className="d-flex flex-wrap justify-content-center space right gap-5">
          {/* Column for the three stacked cards on the left */}
          <div className="d-flex flex-column align-items-center col-12 col-sm-6 col-md-4 col-lg-3 gap-3">
            {/* Card 1 with Icon */}
            <div className="card w-100 d-flex justify-content-center mb-3">
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <GiVendingMachine size={100} className="me-3" />
                  <div>
                    <h5 className="card-title">
                      {mylanguage === 'EN'
                        ? 'Trip Request Submission'
                        : 'የጉዞ ጥያቄ ማስገባት'}
                    </h5>
                    <p className="card-text">
                      {mylanguage === 'EN'
                        ? 'Submit trip details (origin, destination, date, mode, passengers, etc.) for system validation.'
                        : 'የጉዞ ዝርዝሮችን (መነሻ, መድረሻ, ቀን, አካል, ተሳፋሪዎች እና ሌሎች) ለሲስተም ማረጋገጫ ያስገቡ።'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2 with Icon */}
            <div className="card w-100 d-flex justify-content-center mb-3">
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <FcApprove size={100} className="me-3" />
                  <div>
                    <h5 className="card-title">
                      {mylanguage === 'EN'
                        ? 'Trip Approval and Resource Allocation'
                        : 'የጉዞ እንደነጻነት ማጽደቅና ምንዛሬ ትዳት'}
                    </h5>
                    <p className="card-text">
                      {mylanguage === 'EN'
                        ? 'Approve the trip and allocate resources (vehicles, tickets, etc.).'
                        : 'ጉዞውን ያረጋግጡ እና ምንዛሬዎችን (ተሽከርካሪዎች, ትኬቶች እና ሌሎች) ይሰሩ።'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3 with Icon */}
            <div className="card w-100 d-flex justify-content-center mb-3">
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <AiFillSchedule size={100} className="me-3" />
                  <div>
                    <h5 className="card-title">
                      {mylanguage === 'EN'
                        ? 'Trip Confirmation and Scheduling'
                        : 'የጉዞ ማረጋገጫና መርሀ ግብር'}
                    </h5>
                    <p className="card-text">
                      {mylanguage === 'EN'
                        ? 'Confirm details, notify stakeholders, and schedule the trip with reminders.'
                        : 'ዝርዝሮችን ያረጋግጡ፣ ከተጠቃሚዎች ጋር እንደ ነጻነት አገኘ እና አማራጭ ይሰሩ።'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Column for the single card on the right */}
          <div className="d-flex flex-column align-items-center col-12 col-sm-6 col-md-4 col-lg-3 justify-content-center gap-12">
            {/* Card 4 with Icon */}
            <div className="card w-100 d-flex justify-content-center mb-3">
              <div className="card-body">
                <div className="align-items-center">
                  <img src={Car} alt="car img" className="me-3 d-flex car" />
                  <div>
                    <h5 className="card-title">
                      {mylanguage === 'EN' ? 'Trip To Dire Dawa' : 'ጉዞ ወደ ድሬዳዋ'}
                    </h5>
                    <p className="card-text">
                      {mylanguage === 'EN'
                        ? '14-29 June by Biruk Nigusie'
                        : '14-29 ጁን በብሩክ '}{' '}
                      <span>
                        <IoLocation size={25} />
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestSteps;
