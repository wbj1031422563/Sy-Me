/*
 * @Author: FMC
 * @Date: 2024-07-22 21:01:00
 * @LastEditors: FMC
 * @LastEditTime: 2024-07-23 22:22:37
 * @FilePath: \fmc-personal-blog\src\example\sbpk-map\sbpk-echart\sbpk-left-one\sbpk-left-one.jsx
 * @Description:
 */
import * as echarts from "echarts";
import { useEffect, useState, useRef } from "react";
import { getData } from "../../service";
import "./sbpk-left-one.less";
function SbpkLeftOne() {
  const chartRef = useRef(null);
  // const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let initialized=false;
    const initChart = async () => {
      const res = await getData();
      if (!initialized) { 
        // 仅在未初始化时进行初始化，注意不可以将异步请求加入到这个里面，否则不会生效。
        let chartInstance = echarts.init(chartRef.current);
        chartInstance.setOption(getChartOptions(res));
      }
    };

    initChart();

    return () => {
      initialized=true
    };
  }, []);
  return (
    <div className="sbpk-left-one">
      <div className="sbpk-left-one-header">
        <p className="font-size-16">舆情热点处理次数</p>
        <div className=" sbpk-left-one-total-num">
          <p className="font-size-36">236432</p>
          <span>次</span>
        </div>
      </div>
      <div style={{ textAlign: "center", overflow: "hidden" }}>
        <div ref={chartRef} style={{ height: "400px", width: "100%" }}></div>
      </div>
      <div>
        <p>
          已处理：<span style={{ color: "#61f8f7" }}>{575}</span>
        </p>
        <p>
          未处理：<span style={{ color: "#61f8f7" }}>{72}</span>
        </p>
        <p>
          处理中：<span style={{ color: "#61f8f7" }}>{51}</span>
        </p>
      </div>
    </div>
  );
}
export default SbpkLeftOne;

function getChartOptions(data) {
  var baifenbi = data.map(item=>item. baifenbi);
  var grayBar = [1, 1, 1, 1];
  var zongjine = data.map(item=>item.zongjine);
  var xingm =  data.map(item=>item.xingm);
  const option = {
    // backgroundColor: "#061A42",
    color: ["#48E68F", "#52EBEC", "#F77500", "red"], //进度条颜色
    grid: {
      left: "2%", //如果离左边太远就用这个......
      //right: '14%',
      bottom: "5%",
      top: "5%",
      containLabel: true,
    },
    xAxis: [
      {
        show: false,
      },
      //由于下边X轴已经是百分比刻度了,所以需要在顶部加一个X轴,刻度是金额,也隐藏掉
      {
        show: false,
      },
    ],
    yAxis: {
      type: "category",
      axisLabel: {
        show: false, //让Y轴数据不显示
      },
      itemStyle: {},
      axisTick: {
        show: false, //隐藏Y轴刻度
      },
      axisLine: {
        show: false, //隐藏Y轴线段
      },
      data: xingm,
    },
    series: [
      //背景色--------------------我是分割线君------------------------------//
      {
        show: true,
        type: "bar",
        barGap: "-100%",
        barWidth: "35%", //统计条宽度
        itemStyle: {
          normal: {
            color: "rgba(102, 102, 102,0.5)",
          },
        },
        z: 1,
        data: grayBar,
      },
      //蓝条--------------------我是分割线君------------------------------//
      {
        show: true,
        type: "bar",
        barGap: "-100%",
        colorBy: "data",
        barWidth: "35%", //统计条宽度
        max: 1,
        z: 2,
        data: baifenbi,
      },
      //数据条--------------------我是分割线君------------------------------//
      {
        show: true,
        type: "bar",
        xAxisIndex: 1, //代表使用第二个X轴刻度!!!!!!!!!!!!!!!!!!!!!!!!
        barGap: "-100%",
        barWidth: "25%", //统计条宽度
        itemStyle: {
            color: "rgba(0,0,0,0)",
        },
        label: {
          fontSize: 16,
          show: true,
          //label 的position位置可以是top bottom left,right,也可以是固定值
          //在这里需要上下统一对齐,所以用固定值
          position: [0, "-100%"],
          // rich: {
          //   //富文本
          //   white: {
          //     //自定义颜色
          //     color: "#ffffff",
          //   },
          // },
          color:'#fff',
          formatter: function (data) {
            return (
              xingm[data.dataIndex]+'                       '+zongjine[data.dataIndex]+'个'
            );
          },
        },
        data: zongjine,
      },
      {
        show: false,
        type: "bar",
        xAxisIndex: 1, //代表使用第二个X轴刻度!!!!!!!!!!!!!!!!!!!!!!!!
        barGap: "-100%",
        barWidth: "25%", //统计条宽度
        itemStyle: {
          // normal: {
          //   color: "rgba(0,0,0,0)",
          // },
          color: "rgba(0,0,0,0)",
        },
        label: {
          color: "#ccc",
          fontSize: 14,
          show: true,
          //label 的position位置可以是top bottom left,right,也可以是固定值
          //在这里需要上下统一对齐,所以用固定值
          position: [0, "150%"],
          formatter: (data) =>
            `${(baifenbi[data.dataIndex] * 100).toFixed(2)}%`,
        },
        data: zongjine,
      },
    ],
  };
  return option;
}
