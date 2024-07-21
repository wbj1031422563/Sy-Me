/*
 * @Author: FMC
 * @Date: 2024-07-21 20:16:13
 * @LastEditors: FMC
 * @LastEditTime: 2024-07-21 23:42:42
 * @FilePath: \fmc-personal-blog\src\example\sbpk-map\sbpk-echart\sbpk-echart.jsx
 * @Description:
 */
import { useEffect, useState, useRef } from "react";
import * as echarts from "echarts";
import "./sbpk-echart.less";
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
  useEffect(() => {
    let chartInstance = echarts.init(chartRef.current);
    const option = {
      legend: {
        data: [
          "3-11岁任务数",
          "3-11岁全程接种量",
          "60岁任务数",
          "60岁全程接种量",
          "80岁任务数",
          "80岁全程接种量",
          "完成率",
        ],
      },
      xAxis: {
        type: "category",
        data: ["街道1", "街道2", "街道3", "街道4", "街道5", "街道6", "街道7"],
      },
      yAxis: [
        { type: "value" },
        {
          type: "value",
          name: "%",
          nameTextStyle: {
            color: "#ccc",
            padding: [0, 0, 10, -30],
          },
          splitNumber: 5,
          splitLine: {
            show: true,
            lineStyle: {
              type: "dashed",
              width: 1,
              color: ["#ccc", "#ccc"],
            },
          },
          axisLabel: {
            show: true,
            textStyle: {
              fontSize: 12,
            },
          },
        },
      ],
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "shadow",
        },
        textStyle: {
          color: "#fff",
          align: "left",
          fontSize: 14,
        },
        backgroundColor: "rgba(0,0,0,0.8)",
      },
      series: [
        {
          name: "3-11岁任务数",
          data: [150, 230, 224, 218, 135, 147, 260],
          type: "bar",
        },
        {
          name: "3-11岁全程接种量",
          data: [150, 230, 224, 218, 135, 147, 260],
          type: "bar",
        },
        {
          name: "60岁任务数",
          data: [150, 230, 224, 218, 135, 147, 260],
          type: "bar",
        },
        {
          name: "60岁全程接种量",
          data: [880, 30, 124, 118, 35, 47, 160],
          type: "bar",
        },
        {
          name: "80岁任务数",
          data: [660, 30, 124, 118, 35, 47, 160],
          type: "bar",
        },
        {
          name: "80岁全程接种量",
          data: [880, 30, 124, 118, 35, 47, 160],
          type: "bar",
        },
        {
          name: "完成率",
          data: [50, 130, 124, 18, 35, 47, 160],
          yAxisIndex: 1,
          type: "line",
          smooth: true,
        },
      ],
    };
    chartInstance.setOption(option);
  }, []);
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
          <p>舆情热点处理情况</p>
          <div>
            <p>236432</p>
            <p>次</p>
          </div>
          <div style={{ textAlign: "center" }}>
            <h2>React Echarts 折线+柱状图</h2>
            <div ref={chartRef} style={{ height: "400px" }}></div>
          </div>
        </div>
        <div className="sbpk-echarts-right"> </div>
      </div>
    </div>
  );
}
export default SbpkEchart;
