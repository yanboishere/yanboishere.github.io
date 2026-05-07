---
title: "ETH Beijing 活动记｜一个Web3小白的75小时"
date: "2023-04-17"
excerpt: "Hi 我是烟波，好久没更新文章了，今天来写下我最近参加ETH Beijing Hackathon活动的经历"
tags: ["eth", "hackathon", "beijing", "web3"]
mood: "兴奋"
location: "🇨🇳 北京"
---

Hi 我是烟波

好久没更新文章了

今天来写下我最近参加ETH Beijing Hackathon ​活动的经历

在此记下 这段对我来说 很宝贵的经历

## 1.赛前
说实话 对我而言 在参加活动的过程中

真的可以说是**一步一道坎**

因为我在第一轮第二轮报名时的时候

可能因为报名表填的没那么详细的原因

所以一直没有等到邮件

而我的队友 @JiceJin 在第二轮的时候 已经收到邮件

所以当时我觉得我还是再试一下

毕竟我内心之中 还是觉得这次机会十分宝贵

所以在第三轮之前 我又重新仔细填写了一遍报名表

经过一番等待

### 最终在2023年3月28日 我收到了入选邮件：

![image](https://storage.googleapis.com/papyrus_images/29cbb70c5de61c3929101409121fdb5282d3f6676d73ab01b734354cb272b920.png)
看到邀请函之后截图发的朋友圈之后就是：买火车票

（顺便提下 主办方可以给我们报销一半交通费 上限$100 之后食宿全免）

收拾行李 等一系列操作之后，

我坐上了Z118次列车，从吉林市出发，

去北京 开启我的ETH Beijing之旅。

## 2.前期准备
因为我们当时组内只有两个人

而我们报名时 在“你们想在竞赛过程中 做什么项目？”一栏中

填的是：

**我和我的队友需要进一步讨论，我想会是一个基于Ethereum的Web3学习网站**（@JiceJin）

但是我们在竞赛前的几天 仍旧几乎没有任何思路

我们之前 确实有过制作wiki相关的网站

但是那和赛题完全不相关

（更别说上链了，现在的wiki 其实是个有Web3知识内容的纯粹的Web2产品）

而且比赛本身 也是需要我们去构建一个全新的项目

而不是拿已有的来做

所以我们当时的处境就是：

必须想到一个全新的项目

跟我们现在做的知识学习平台相关的项目

最终 在赛前大约五六天左右

我突然想到一个想法

就是说 把学习的过程创新一下

之后在最后 找一个时机

去给用户sbt/NFT 进行奖励

最后形成一个学习闭环过程、形成用户的学习主动性

方向找到了 @[JiceJin](https://github.com/JiceJin)和我 现在需要的就是找其他队友了

（因为就我们两个人 肯定在三天的时间里 做不了我们想做的这么多）

他也曾经在微信上跟我说 他很担心我们的项目做不出来 等等

毕竟 我们的项目真的是从0开始

我们俩前期在微信上讨论的时候 连使用什么技术栈 都讨论不出一个最终结果

（还是要感谢@[Azleal](https://github.com/Azleal) 没有他最初在讨论时 给我们的建议 要不然我们真的很难去选择用什么去做……）

我当时就说 我们还是主要**重在参与** 结果什么的都无所谓了

（确实如此 毕竟我们基本都算是 Web3小白）

后来经过一段时间 在比赛开始前的三两天 我也一直在努力寻找队友

（加了不少正式活动群里 还没组队的群友 尝试找一位对我们项目感兴趣的朋友）

最终很幸运 我在比赛前也找齐了另外两位队友

那么 就开始吧！

## 3.Buidl开始！

### 签到日
在比赛开始之前 其实我有预料到参加活动的大佬有很多

但是我还是有惊讶到

第一天就见到很多 我只闻其名、从未见面的大佬

![image](https://storage.googleapis.com/papyrus_images/ef7144b62cd2a9fc0e44e7153d81851dd18cc2da9aa985a220e8f3c6a5c7737d.png)
当时的感受如上⬆️ （这条Twitter 后来主办方转发了）
很快的

在开幕式前5分钟 我们队伍四人（我 、@[JiceJin](https://github.com/JiceJin)、 @[Azleal](https://github.com/Azleal) 、@[woHocooL](https://github.com/woHocooL)）集合完毕

![image](https://storage.googleapis.com/papyrus_images/3e3eab6a3505f517a80ed3c491e075f7326363107979a0f0c99353aa30c018c3.jpg)
开幕会现场 我在讲解我们的项目 （......当时挺紧张说实话）
之后我们在开幕式结束之后，开始集体讨论一下明后几天的Build路线以及分工。

![image](https://storage.googleapis.com/papyrus_images/54b33f2aa69fd48dffe3c2dd6aa12407bc927fc23bb7486fafa3e0b223240ecc.png)
我们当时最初决定的分工
**Day1**

![image](https://storage.googleapis.com/papyrus_images/1df9b1ebfdeba9c2b397b2ee9d2c5b4e5514655025fa89c1bab4c0f1c5e6c566.jpg)
Buidl
第一天我们先确定我们使用的框架和主要技术栈

前端我们主要是用了VUE 因为我们时间所限 所以我们使用的开源项目

[https://github.com/Coffcer/vue-chat](https://github.com/Coffcer/vue-chat)

(之后我们后来发现 这个用的是VUE1 开发出来的……)

之后 @[Azleal](https://github.com/Azleal)问我我前端会做哪些 我当时特别小声的说我只会HTML……

确实 前端的技术栈 我大一上学期刚开始学 也就只会HTML了……😂

（……所以虽然我是队长，但是整个项目的code部分多数都不是我做的

以至于我经常自嘲我自己 最精通的技术栈是 markdown）

之后我就做了一天的项目文档 还有逻辑设计

这一天我们主要做了项目的 前端和后端

![image](https://storage.googleapis.com/papyrus_images/df294f3b86fc55bf84af9a70d8e977b2bf3f3c4c5f72219519272ea7d0d1f84f.png)
Day1 @Azleal @JiceJin 做的界面
![image](https://storage.googleapis.com/papyrus_images/6687df87a5ddf16c78027c498a8a55aca77126ed4dce1b9f99f4f25312e40884.png)
当时提交的项目进度
值得一提的是

当天的workshop活动-高校场

我在活动中的问答环节

非常有幸 问了清北复浙 链协的0xAA、luna、Story和Maverick

有关我们做wiki的一个问题

最后他们的回答 也解决了我心中一直以来的问题

![image](https://storage.googleapis.com/papyrus_images/70ef78d0853eaf8b4305b55a188ada71cc928f878a607d2b97c7a58014a09ce8.png)
workshop day1开场 黑色衣服 手在金色Mac触控板上滑动的人是我 我对面是@Azleal（图片来自@0xAA的Twitter）
@Azleal中午的时候 就已经把后端的框架给做完了（内心：wow 🆒）

之后后端的内容 就靠我和 @woHocool 一起来填充的

一天到最后 @woHocool @JiceJin 把自己手里的任务都做完了 （文案、交互逻辑｜前端）

我还在后端的.json中迷糊着……

那一晚 我熬了一通宵 去把我们的交互内容植入到.json文件中，还有就是再检查一遍项目。

本想着自己不能耽误项目进度，结果我搞了一晚上才搞了1/3……🎃

### Day2
当天晚上0:05 @Azleal 在群里说：

改成vue2了

![image](https://storage.googleapis.com/papyrus_images/030bbb83bb68b2f38a74fe70c7f462da060fd1367956b8730b45e3ead814aa54.png)
🐮🍺
当时第一感觉 他真的是大佬……

（后来我从0xAA那里了解到 原来Azleal也是WTF solidity的贡献者之一）

当时也真的很激动 因为我们的项目聊天框架 在vue2的前提下 就更好做了

到这 demo算是成了一半了

现在就主要是后端、智能合约 以及内容上的完善了

而我感觉 那一夜又要熬夜了……

毕竟我们当时的进度当时还是稍慢了些。

那一晚 我和 @JiceJin @woHocool 都在客栈通宵做项目

@Azleal 已经回到北京的家里了

但是半夜1点多 当我睡眼惺忪之中 看到提交信息

看到他还在提交

那一刻 我真的很感动

我们大家都在努力为着项目“奔跑”着 直至哨声响起的一刻……

![image](https://storage.googleapis.com/papyrus_images/a5b97a8835055440adbf68a747bf7ebbeb27156173473ecb91fc92c690a011dc.jpg)
这时候 已经是第三天......

### Day3
第三天 我们就基本补充了一下智能合约 以及后端的部分

还有就是Docker的部署 最后再检查一遍

最后还有就是完成 下午三点提交时的要求 （比如制作展示视频）

[https://www.bilibili.com/video/BV1PM4y117Ab/](https://www.bilibili.com/video/BV1PM4y117Ab/)

（当时因为时间原因 我们使用的Ai配音）

最终到了下午三点 PR提交到活动的GitHub项目上去之后

我们的三天Buidl之旅 算是结束了……

[https://github.com/WTFAcademy/ETHBeijing/blob/main/team-info.md#9-web3club](https://github.com/WTFAcademy/ETHBeijing/blob/main/team-info.md#9-web3club)

[https://github.com/Web3-Club/Web3-Interactive-Learning](https://github.com/Web3-Club/Web3-Interactive-Learning)

那一刻 我们真的把我最初所想的效果 做出来了

无论最终评奖结果如何 我已非常满足

而且在活动中 我也感受到 我要学的仍旧很多 长路漫漫……

不过 一点点来吧！I can！

![image](https://storage.googleapis.com/papyrus_images/e178dfe7b299338b765c5033f0060879cc482cdc7970542ca69b95376c2f1b46.png)
❤️
![image](https://storage.googleapis.com/papyrus_images/67b02d0d74dee2c586112ceff3a53aafe2552cb261bfbc181b5be6f5a708c25c.jpg)
After Party
![image](https://storage.googleapis.com/papyrus_images/7bf6af87641b112d95675a0f3b95dabb224f10c2aa04493f600c22cbdce9d9eb.jpg)
WE
![image](https://storage.googleapis.com/papyrus_images/fa57ca0912650ef1e969a6f933df119eff0d845e0ce7538866f7225907fa137b.jpg)
最后请忙了三天的各位 吃了我家那边的朝鲜族特色烧烤 在五道口的连锁店

## 4.结语
毫不夸张的说 我的2023年的第一季度 

**简直就如一场梦一般**：

做项目 获得了第一笔赞助（@antoniayly 的 0.5ETH）

自己组建了一个开源组织

到参与活动 领导团队从0开始做出了一个项目雏形

也在活动中 认识了巨多领域内的朋友

比如给我最初想法提建议的@P仔 无论Web3还是crypto领域都很厉害的@沉稳缓 以及学金融的技术大佬@Wong Shouhao 等等

特别是由此次活动的契机 我见到了@JiceJin

我也很高兴在这次活动中 能与他线下见面

可以说 是他的帮助 （无论是最早的wiki 还是本次活动）让我走到了现在👏

还有就是@Azleal 、@woHocool 感谢他们这段时间的通力合作

感谢@0xAA 和WTF academy PKU Blockchain 举办了如此精彩的一场活动

未来我也会继续与@Web3Club Build Forever！

明年见！

烟波 2023年4月17日

吉林省吉林市

---

*本文首发于 [paragraph.com/@yanbowang](https://paragraph.com/@yanbowang/eth-beijing-web3-75)*
