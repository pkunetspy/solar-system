# 天体纹理说明

本目录用于存放太阳系天体的表面纹理文件。系统会从此目录加载相应的纹理文件来渲染天体表面。

## 纹理文件命名规范

请将纹理文件放在此目录下，按以下命名规范：

### 内太阳系
- `sun_2k.jpg` - 太阳表面纹理 ✅ 已有
- `mercury_2k.jpg` - 水星表面纹理 ✅ 已有
- `venus_2k.jpg` - 金星表面纹理 ✅ 已有
- `earth_2k.jpg` - 地球表面纹理（NASA Blue Marble数据）✅ 已有
- `moon_2k.jpg` - 月球表面纹理 ✅ 已有
- `mars_2k.jpg` - 火星表面纹理 ✅ 已有

### 外太阳系
- `jupiter_2k.jpg` - 木星表面纹理 ✅ 已有
- `saturn_2k.jpg` - 土星表面纹理 ✅ 已有
- `uranus_2k.jpg` - 天王星表面纹理 ✅ 已有
- `neptune_2k.jpg` - 海王星表面纹理 ✅ 已有

### 矮行星
- `pluto_2k.jpg` - 冥王星表面纹理 ✅ 已有

## 推荐纹理来源

### 免费资源
1. **Solar System Scope** - https://www.solarsystemscope.com/textures/
   - 基于NASA数据的高质量纹理
   - 免费下载，支持2K、4K、8K分辨率
   
2. **Planet Pixel Emporium** - http://planetpixelemporium.com/planets.html
   - 专业级行星纹理
   - 提供颜色贴图和凹凸贴图

3. **NASA官方资源** - https://maps.jpl.nasa.gov/
   - 官方行星地图和数据

## 文件格式要求

- **格式**: JPG 或 PNG
- **推荐分辨率**: 2048x1024 (2K) - 平衡质量和性能
- **文件大小**: 建议每个文件 < 5MB
- **色彩空间**: sRGB

## 纹理优化建议

1. **压缩**: 使用适当的JPEG压缩率（85-95%）
2. **mipmap**: 系统会自动生成mipmap以提高渲染性能
3. **包装模式**: 系统默认使用RepeatWrapping以支持球面映射

## 使用说明

1. 将纹理文件下载到此目录
2. 确保文件名符合命名规范
3. 重新启动应用或刷新浏览器
4. 进入近景模式时会自动加载相应纹理

**注意**: 如果对应天体的纹理文件不存在，系统会回退到使用原始的纯色材质。