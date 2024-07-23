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
        <p className="time sbpk-echarts-header-side">{timeFormat(time)}</p>
        <h2>舆情热点实时监控系统</h2>
        <div className="search sbpk-echarts-header-side">
          <input className="sbpk-input" type="text" />
          <button className="sbpk-button m-l-5">
            <span>搜索</span>
          </button>
        </div>
      </div>
      <div className="sbpk-echarts-body">
        <div className="sbpk-echarts-left">
            <SbpkLeftOne/>
        </div>
        <div className="sbpk-echarts-right">
            <SbpkRightOne/>
           </div>
      </div>
    </div>
  );
}
export default SbpkEchart;
