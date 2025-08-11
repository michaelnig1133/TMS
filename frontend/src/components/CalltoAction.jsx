import React from 'react';
import Allocate from "../assets/Allocate.jpg";
import Schedule from "../assets/Schedule.jpg";
import { useLanguage } from '../context/LanguageContext';

const CalltoAction = () => {
  const { mylanguage } = useLanguage(); // Access the current language context

  return (
    <div className="container py-4">
      {/* Card 1 */}
      <div className="row justify-content-center mb-3">
        <div className="col-12 col-md-8">
          <div className="card h-100">
            <div className="card-body d-flex align-items-center">
              {/* Image on the left */}
              <div className="image-container me-4">
                <img src={Allocate} alt="Allocation Image" className="card-img" />
              </div>
              <div>
                <h5 className="card-title">
                  {mylanguage === 'EN' ? 'Get started Today!' : 'ዛሬ ጀምሩ!'}
                </h5>
                <p className="card-text">
                  {mylanguage === 'EN'
                    ? 'Take control of your transportation management and achieve unparalleled efficiency.'
                    : 'የመጓጓዣ አስተዳደርዎን በቀላሉ ተቆጣጥሩና ያልተሳካ ውጤት ያግኙ።'}
                </p>
                <p className="text-center">
                  {mylanguage === 'EN'
                    ? 'With TMS, you can simplify complex processes, reduce costs, and ensure compliance—all in one powerful platform. Whether you’re managing a single fleet or planning for large-scale implementation across multiple departments, TMS has the tools you need to succeed.'
                    : 'ከTMS ጋር፣ የተወሳሰቡ ሂደቶችን ቀላል ያድርጉ፣ ወጪን ቀንሱ፣ እና መስፈርቶችን ያረጋግጡ። ከአንድ ተሽከርካሪ እስከ በርካታ ክፍሎች በመከፈት ትስስር ያለው ዕቅድ እስከሆነ ሁሉንም የምትሆን መሳሪያ አለው።'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card 2 */}
      <div className="row justify-content-center">
        <div className="col-12 col-md-8">
          <div className="card h-100">
            <div className="card-body d-flex align-items-center">
              <div>
                <h5 className="card-title">
                  {mylanguage === 'EN'
                    ? 'Trip Approval and Resource Allocation'
                    : 'የጉዞ ማረጋገጫና ምንዛሬ አስከትል'}
                </h5>
                <p className="card-text">
                  {mylanguage === 'EN'
                    ? 'Approve the trip and allocate resources (vehicles, tickets, etc.).'
                    : 'ጉዞውን ያረጋግጡ እና ምንዛሬዎችን (ተሽከርካሪዎች፣ ትኬቶች እና ሌሎች) ይሰሩ።'}
                </p>
              </div>
              {/* Image on the right */}
              <div className="image-container ms-4">
                <img src={Schedule} alt="Schedule Image" className="card-img" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalltoAction;
