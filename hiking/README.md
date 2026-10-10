# Hiking 游记维护入口

新增游记或修改照片体验前，请读取 [照片交互规范](PHOTO-INTERACTIONS.md) 和 [当前版本索引](photo-viewer-contract.json)。

在线入口：https://zeror.ca/hiking/photo-interactions/

共用实现位于 shared；完整可运行示例位于 examples/journal.html。不要为每篇游记复制一份手势代码。修改规则、实现、版本、示例、测试后统一发布，更新和回退步骤都写在规范中。

回归测试：`node hiking/tests/photo-viewer.test.cjs .`。

重建规范网页：`python hiking/tools/build-photo-contract.py`。以上命令从网站仓库根目录运行，只使用标准库。
