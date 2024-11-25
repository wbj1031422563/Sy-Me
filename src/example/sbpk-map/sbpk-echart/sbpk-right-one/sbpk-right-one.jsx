
import { useEffect,useState } from "react";
import { getData2 } from "../../service";
import "./sbpk-right-one.less";

function SbpkRightOne() {
  const [list, setList] = useState([]);

  useEffect(() => {
    let initialized = false;
    const initChart = async () => {
      const res = await getData2();
      if (!initialized) {
        // 仅在未初始化时进行初始化，注意不可以将异步请求加入到这个里面，否则不会生效。
        setList(res);
      }
    };

    initChart();

    return () => {
      initialized = true;
    };
  }, []);
  return (
    <>
      <div className="sbpk-right-one">
        <h3 className="sbpk-right-one-header">舆情热点信息统计</h3>
        <div className="sbpk-right-one-body">
          {list.map((item) => (
            <div className="sbpk-right-one-item" key={item.country}>
              <span> {item.country}</span>
              <div className="right-container"> 
                <span>{item.num}</span>
                <div className="right-text">
                <img src={item.changeType=='up'?"/icon/up.png":"/icon/down.png"} width={"20px"}/>
                  <span>{parseFloat(item.changeNum).toFixed(1)}%</span>
                </div>
              </div>
              <div className="line"></div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
export default SbpkRightOne;
