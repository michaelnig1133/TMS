import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import Typewriter from 'react-typewriter-effect';
import { Carousel } from 'react-bootstrap';
import Car from '../assets/car.png';
import Car2 from '../assets/car2.png';
import Car3 from '../assets/car3.png';
import '../index.css'

const Home = () => {
  const { mylanguage } = useLanguage();
  const { myTheme } = useTheme();

  return (
    <div className={`home-container ${myTheme === "dark" ? "dark" : ""}`}>
      <div className="header-section">
        <div className="header-content">
          <h5 className="headertext1">
            {mylanguage === 'EN' 
              ? 'Ministry of Innovation and Technology' 
              : 'የኢኖቬሽንና ቴክኖሎጂ ሚኒስቴር'}
          </h5>
          <h2 
            className="headertext2"
            style={{
              color: myTheme === "dark" ? "#B3A2F0" : "#106374",
            }}
          >
            <Typewriter
              key={mylanguage}
              multiText={mylanguage === 'EN' 
                ? [
                    "Streamline Your Fleet, Optimize Your Journey!",
                    "Revolutionize Your Workflow with TMS!",
                    "Efficient Transport Solutions for Modern Businesses!"
                  ]
                : [
                    "መጓጓዣዎን በማቀናበር, የእርስዎን ጉዞ ያሻሽሉ!",
                    "የትራንስፖርት አስተዳደር ስርዓት አብዮት ይፍጥሩ!",
                    "ለዘመናዊ ቢዝነሶች ውጤታማ የመጓጓዣ መፍትሄዎች!"
                  ]
              }
              multiTextLoop={true}
              typeSpeed={100}
              deleteSpeed={100}
              cursorColor="#F09F33"
            />
          </h2>
          <p className="headertext3">
            {mylanguage === 'EN' 
              ? 'Discover a smarter way to manage transportation. The Transport Management System (TMS) revolutionizes your workflow, digitizing and automating every step to save time, reduce inefficiencies, and ensure seamless coordination.' 
              : 'መጓጓዣ ለመቆጣጠር የሚያስችል ብልህ ዘዴ ይኑርህ። የትራንስፖርት አስተዳደር ስርዓት (TMS) የእርስዎን የስራ ፍሰት አብዮት, ጊዜ ለመቆጠብ, ውጤታማነትን ለመቀነስ እና ስፌት አልባ ቅንጅት ለማረጋገጥ እያንዳንዱን እርምጃ ዲጂቲንግ እና አውቶማቲክ ያደርገዋል.'}
          </p>
        </div>
        
        <div className="carousel-section">
          <Carousel interval={3000} controls={false} indicators={true}>
            <Carousel.Item>
              <img
                className="d-block w-100"
                src={Car}
                alt="First slide"
              />
              <Carousel.Caption>
                <h5>{mylanguage === "EN" ? "Efficient Fleet Management" : "ውጤታማ የመጓጓዣ አስተዳደር"}</h5>
              </Carousel.Caption>
            </Carousel.Item>
            <Carousel.Item>
              <img
                className="d-block w-100"
                src={Car2}
                alt="Second slide"
              />
              <Carousel.Caption>
                <h5>{mylanguage === "EN" ? "Seamless Transportation" : "የተሳለጠ መጓጓዣ"}</h5>
              </Carousel.Caption>
            </Carousel.Item>
            <Carousel.Item>
              <img
                className="d-block w-100"
                src={Car3}
                alt="Third slide"
              />
              <Carousel.Caption>
                <h5>{mylanguage === "EN" ? "Innovative Solutions" : "አዳዲስ መፍትሄዎች"}</h5>
              </Carousel.Caption>
            </Carousel.Item>
          </Carousel>
        </div>
      </div>
    </div>
  );
};

export default Home;