import { useEffect, useState, useRef } from "react";
import * as echarts from "echarts";
import "./sbpk-echart.less";
import SbpkLeftOne from "./sbpk-left-one/sbpk-left-one";
import SbpkRightOne from "./sbpk-right-one/sbpk-right-one";
function SbpkEchart() {
  const chartRef = useRef(null);
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000); // 每秒更新一次时间

    return () => clearInterval(timer); // 清理定时器
  }, []);

  const padZero = (number) => (number < 10 ? `0${number}` : number);
  const timeFormat = (time) => {
    const year = time.getFullYear();
    const month = time.getMonth() + 1;
    const date = time.getDate();
    const hours = padZero(time.getHours());
    const minutes = padZero(time.getMinutes());
    const seconds = padZero(time.getSeconds());

    return `${year}年${month}月${date}日 ${hours}:${minutes}:${seconds}`;
  };
  return (
    <div className="sbpk-echarts">
      <div className="sbpk-echarts-header">
        <h2 className="title">大屏数据展示</h2>
        <p className="time">{timeFormat(time)}</p>
      </div>
      <div className="sbpk-echarts-body">
        <div className="sbpk-echarts-left">
          <div className="sbpk-echarts-row">
            <div className="echart-header">
              <img
                className="icon"
                src={"/img/echarts/功能定义.png"}
                width={25}
              />
              <p>数据标题1</p>
            </div>
            <div className="echart-container"></div>
          </div>
          <div className="sbpk-echarts-row">
            <div className="sbpk-echarts-col">
              <div className="echart-header">
                <img
                  className="icon"
                  src={"/img/echarts/规则引擎.png"}
                  width={25}
                />
                <p>数据标题2</p>
              </div>
            </div>
            <div className="sbpk-echarts-col">
              <div className="echart-header">
                <img
                  className="icon"
                  src={"/img/echarts/节点管理.png"}
                  width={25}
                />
                <p>数据标题3</p>
              </div>
            </div>
          </div>
          <div className="sbpk-echarts-row">
            <div className="sbpk-echarts-col">
              <div className="echart-header">
                <img
                  className="icon"
                  src={"/img/echarts/设备管理.png"}
                  width={25}
                />
                <p>数据标题4</p>
              </div>
            </div>
            <div className="sbpk-echarts-col">
              <div className="echart-header">
                <img
                  className="icon"
                  src={"/img/echarts/神经.png"}
                  width={25}
                />
                <p>数据标题5</p>
              </div>
            </div>
          </div>
          <div className="sbpk-echarts-row">
            <div className="echart-header">
              <img
                className="icon"
                src={"/img/echarts/图表-折线图.png"}
                width={25}
              />
              <p>数据标题6</p>
            </div>
            <div className="echart-container"></div>
          </div>
        </div>
        <div className="sbpk-echarts-right">{/* <SbpkRightOne /> */}</div>
      </div>
    </div>
  );
}
export default SbpkEchart;
